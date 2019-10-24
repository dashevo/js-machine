const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const checkTxHandlerFactory = require('../../../../lib/abci/handlers/checkTxHandlerFactory');
const getDataContractFixture = require('../../../../lib/test/fixtures/getDataContractFixture');
const getDataContractStateTransitionFixture = require('../../../../lib/test/fixtures/getDataContractStateTransitionFixture');

const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../lib/abci/errors/AbciError');

describe('checkTxHandlerFactory', () => {
  let checkTxHandler;
  let request;
  let dppMock;

  beforeEach(async function beforeEach() {
    const dataContractFixture = getDataContractFixture();
    const stateTransitionFixture = await getDataContractStateTransitionFixture(dataContractFixture);

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    dppMock = createDPPMock(this.sinon);

    checkTxHandler = checkTxHandlerFactory(dppMock);
  });

  it('should validate State Transition and return response with code 0', async () => {
    const response = await checkTxHandler(request);

    expect(response).to.be.an.instanceOf(ResponseCheckTx);
    expect(response.code).to.equal(0);

    expect(dppMock.stateTransition.createFromSerialized).to.be.calledOnceWith(request.tx);
  });

  it('should throw InvalidArgumentAbciError if State Transition is not specified', async () => {
    try {
      await checkTxHandler({});

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if State Transition is invalid', async () => {
    dppMock.stateTransition.createFromSerialized.throws(new InvalidStateTransitionError());

    try {
      await checkTxHandler(request);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw the error from createFromSerialized if throws not InvalidStateTransitionError', async () => {
    dppMock.stateTransition.createFromSerialized.throws(new Error('Custom error'));

    try {
      await checkTxHandler(request);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.equal('Custom error');
    }
  });
});
