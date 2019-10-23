const cbor = require('cbor');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const decodeStateTransitionFactory = require('../../lib/decodeStateTransitionFactory');

const getRequestTxFixture = require('../../lib/test/fixtures/getRequestTxFixture');
const getDataContractFixture = require('../../lib/test/fixtures/getDataContractFixture');
const getDataContractStateTransitionFixture = require('../../lib/test/fixtures/getDataContractStateTransitionFixture');

const InvalidArgumentAbciError = require('../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../lib/abci/errors/AbciError');

describe('decodeStateTransitionFactory', () => {
  let stateTransitionFixture;
  let stRequestFixture;
  let dppMock;
  let decodeStateTransition;

  beforeEach(async function beforeEach() {
    const dataContractFixture = getDataContractFixture();
    stateTransitionFixture = await getDataContractStateTransitionFixture(dataContractFixture);
    stRequestFixture = getRequestTxFixture(stateTransitionFixture);

    dppMock = createDPPMock(this.sinon);
    dppMock.stateTransition.createFromSerialized.resolves(stateTransitionFixture);

    decodeStateTransition = decodeStateTransitionFactory(dppMock);
  });

  it('should throw InvalidArgumentAbciError if stateTransition is not specified', async () => {
    // Remove stateTransition from request
    const decodedSTFixture = cbor.decode(stRequestFixture);

    delete decodedSTFixture.stateTransition;

    stRequestFixture = cbor.encode(decodedSTFixture);

    try {
      await decodeStateTransition(stRequestFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stateTransition is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stateTransition is invalid', async () => {
    dppMock.stateTransition.createFromSerialized.throws(new InvalidStateTransitionError());

    try {
      await decodeStateTransition(stRequestFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stateTransition is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw the error from createFromSerialized if throws not InvalidStateTransitionError', async () => {
    dppMock.stateTransition.createFromSerialized.throws(new Error('Custom error'));

    try {
      await decodeStateTransition(stRequestFixture);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.equal('Custom error');
    }
  });

  it('should return decoded stateTransition', async () => {
    const result = await decodeStateTransition(stRequestFixture);

    expect(result.toJSON()).to.deep.equal(stateTransitionFixture.toJSON());
  });
});
