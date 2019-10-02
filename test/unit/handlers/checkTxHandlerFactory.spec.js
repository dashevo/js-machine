const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');
const cbor = require('cbor');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const checkTxHandlerFactory = require('../../../lib/handlers/checkTxHandlerFactory');
const getRequestTxFixture = require('../../../lib/test/fixtures/getRequestTxFixture');
const getStHeaderFixture = require('../../../lib/test/fixtures/getStHeaderFixture');
const getStPacketFixture = require('../../../lib/test/fixtures/getStPacketFixture');
const InvalidArgumentAbciError = require('../../../lib/handlers/errors/InvalidArgumentAbciError');
const AbciError = require('../../../lib/handlers/errors/AbciError');

describe('checkTxHandlerFactory', () => {
  let checkTxHandler;
  let dppMock;
  let request;
  let requestTxFixture;
  let stPacketFixture;
  let stHeaderFixture;

  beforeEach(function beforeEach() {
    stPacketFixture = getStPacketFixture();
    stHeaderFixture = getStHeaderFixture(stPacketFixture);
    requestTxFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);

    dppMock = createDPPMock(this.sinon);
    dppMock.packet.createFromSerialized.resolves(stPacketFixture);
    dppMock.packet.validate.resolves({
      isValid: this.sinon.stub().returns(true),
    });
    checkTxHandler = checkTxHandlerFactory(dppMock);

    request = {
      tx: requestTxFixture,
    };
  });

  it('should return valid result', async () => {
    const result = await checkTxHandler(request);

    expect(dppMock.packet.createFromSerialized).to.be.calledOnce();
    expect(dppMock.packet.validate).to.be.calledOnce();
    expect(result).to.be.an.instanceOf(ResponseCheckTx);
  });

  it('should throw InvalidArgumentAbciError if stHeader is not specified', async () => {
    const decodedRequestTxFixture = cbor.decode(requestTxFixture);
    delete decodedRequestTxFixture.header;
    requestTxFixture = cbor.encode(decodedRequestTxFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await checkTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stHeader is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stPacket is not specified', async () => {
    const decodedRequestTxFixture = cbor.decode(requestTxFixture);
    delete decodedRequestTxFixture.packet;
    requestTxFixture = cbor.encode(decodedRequestTxFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await checkTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stPacket is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stHeader is invalid', async function main() {
    requestTxFixture = getRequestTxFixture({
      serialize: this.sinon.stub().returns(Buffer.alloc(8)),
    }, stPacketFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await checkTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stHeader is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stHeader hashSTPacket is not equal to stPacket hash', async () => {
    stHeaderFixture.extraPayload.setHashSTPacket('00'.repeat(32));
    requestTxFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await checkTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stHeader hashSTPacket is not equal to stPacket hash');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stPacket is invalid', async function main() {
    dppMock.packet.validate.resolves({
      isValid: this.sinon.stub().returns(false),
      getErrors: this.sinon.stub(),
    });

    try {
      await checkTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stPacket is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });
});
