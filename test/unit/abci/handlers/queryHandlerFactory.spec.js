const cbor = require('cbor');

const IdentityModel = require('@dashevo/dpp/lib/identity/model/IdentityModel');

const queryHandlerFactory = require('../../../../lib/abci/handlers/queryHandlerFactory');
const InvalidIdentityIdError = require('../../../../lib/identity/errors/InvalidIdentityIdError');

const AbciError = require('../../../../lib/abci/errors/AbciError');
const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');

describe('queryHandlerFactory', () => {
  let queryHandler;
  let identityRepositoryMock;
  let identityModel;
  let request;
  let identityEncoded;

  beforeEach(function beforeEach() {
    const id = 'testId';

    request = {
      path: '/identity',
      data: Buffer.from(id),
    };

    identityModel = new IdentityModel({
      id,
      publicKey: 'testPublicKey',
    });

    identityEncoded = cbor.encode(identityModel.toJSON());

    identityRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    identityRepositoryMock.fetch.withArgs(id).resolves(identityEncoded);
    identityRepositoryMock.fetch.withArgs('unknownId').resolves(null);
    identityRepositoryMock.fetch.withArgs(null).throws(new InvalidIdentityIdError(null));

    queryHandler = queryHandlerFactory(identityRepositoryMock);
  });

  it('should fetch identity by id', async () => {
    const response = await queryHandler(request);

    expect(response).to.be.an.instanceOf(Object);
    expect(response.code).to.equal(0);
    expect(response.value).to.deep.equal(identityEncoded);
  });

  it('should return null if id not found', async () => {
    request.data = Buffer.from('unknownId');

    const response = await queryHandler(request);

    expect(response).to.be.an.instanceOf(Object);
    expect(response.code).to.equal(0);
    expect(response.value).to.equal(null);
  });

  it('should throw InvalidArgumentAbciError error if id is not defined', async () => {
    request.data = null;

    try {
      await queryHandler(request);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Data is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should return error if type is wrong', async () => {
    request.path = '/wrongPath';

    try {
      await queryHandler(request);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Invalid path');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });
});
