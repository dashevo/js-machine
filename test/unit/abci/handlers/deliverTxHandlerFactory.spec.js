const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const DashPlatformProtocol = require('@dashevo/dpp');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const ConsensusError = require('@dashevo/dpp/lib/errors/ConsensusError');
const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');

const deliverTxHandlerFactory = require('../../../../lib/abci/handlers/deliverTxHandlerFactory');
const UpdateStatePromiseClientMock = require('../../../../lib/test/mock/UpdateStatePromiseClientMock');

const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../lib/abci/errors/AbciError');

describe('deliverTxHandlerFactory', () => {
  let deliverTxHandler;
  let driveUpdateStateClient;
  let request;
  let identityRequest;
  let blockHeight;
  let blockHash;
  let dppMock;
  let blockchainStateMock;
  let createIdentityStateTransitionFixture;
  let stateTransitionFixture;
  let identityRepositoryMock;
  let identityFixture;
  let blockExecutionDBTransactionsMock;
  let dbTransaction;
  let dpp;

  beforeEach(function beforeEach() {
    const dataContractFixture = getDataContractFixture();

    dpp = new DashPlatformProtocol();
    identityFixture = getIdentityFixture();
    createIdentityStateTransitionFixture = getIdentityCreateSTFixture();

    stateTransitionFixture = dpp.dataContract.createStateTransition(dataContractFixture);

    identityRepositoryMock = {
      fetch: this.sinon.stub(),
      store: this.sinon.stub(),
    };

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    identityRequest = {
      tx: createIdentityStateTransitionFixture.serialize(),
    };

    dppMock = createDPPMock(this.sinon);
    dppMock
      .stateTransition
      .createFromSerialized
      .resolves(stateTransitionFixture);
    dppMock
      .stateTransition
      .createFromSerialized
      .withArgs(createIdentityStateTransitionFixture.serialize())
      .resolves(createIdentityStateTransitionFixture);
    dppMock
      .stateTransition
      .validateData
      .resolves({
        isValid: this.sinon.stub().returns(true),
      });

    dppMock.identity.applyStateTransition = this.sinon.stub().returns(identityFixture);

    blockHeight = 1;
    blockHash = Buffer.alloc(0);

    blockchainStateMock = {
      getLastBlockHeight: this.sinon.stub().returns(blockHeight),
    };
    driveUpdateStateClient = new UpdateStatePromiseClientMock(this.sinon);

    dbTransaction = this.sinon.stub();

    blockExecutionDBTransactionsMock = {
      getIdentityTransaction: this.sinon.stub().returns(dbTransaction),
    };

    deliverTxHandler = deliverTxHandlerFactory(
      dppMock,
      driveUpdateStateClient,
      blockchainStateMock,
      identityRepositoryMock,
      blockExecutionDBTransactionsMock,
    );
  });

  it('should apply State Transition and return response with code 0', async () => {
    const response = await deliverTxHandler(request);

    const applyStateTransitionRequest = new ApplyStateTransitionRequest();

    applyStateTransitionRequest.setBlockHeight(blockHeight);
    applyStateTransitionRequest.setBlockHash(blockHash);

    applyStateTransitionRequest.setStateTransition(
      stateTransitionFixture.serialize(),
    );

    expect(response).to.be.an.instanceOf(ResponseDeliverTx);
    expect(response.code).to.equal(0);

    expect(driveUpdateStateClient.applyStateTransition).to.be.calledOnceWith(
      applyStateTransitionRequest,
    );

    expect(identityRepositoryMock.store).to.be.not.called();
    expect(identityRepositoryMock.fetch).to.be.not.called();
  });

  it('should throw InvalidArgumentAbciError if State Transition is not specified', async () => {
    try {
      await deliverTxHandler({});

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if State Transition is invalid', async () => {
    const consensusError = new ConsensusError('Invalid state transition');
    const error = new InvalidStateTransitionError(
      [consensusError],
      createIdentityStateTransitionFixture.toJSON(),
    );

    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await deliverTxHandler(request);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.getData()).to.deep.equal({
        errors: [consensusError],
      });
    }
  });

  it('should throw the error from createFromSerialized if throws not InvalidStateTransitionError', async () => {
    const error = new Error('Custom error');
    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await deliverTxHandler(request);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.equal(error);
    }
  });

  it('should set identity model if ST has IDENTITY_CREATE type', async () => {
    await deliverTxHandler(identityRequest);

    expect(identityRepositoryMock.store).to.be.calledWithExactly(identityFixture, dbTransaction);
    expect(identityRepositoryMock.fetch).to.be.calledWithExactly(
      createIdentityStateTransitionFixture.getIdentityId(),
      dbTransaction,
    );
    expect(driveUpdateStateClient.applyStateTransition).to.be.not.called();
  });

  it('should throw an error on invalid data in identity state transition', async function it() {
    dppMock
      .stateTransition
      .validateData
      .resolves({
        isValid: this.sinon.stub().returns(false),
        getErrors: this.sinon.stub(),
      });

    try {
      await deliverTxHandler(identityRequest);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Invalid State Transition data');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw an error with unknown state transition type', async function it() {
    stateTransitionFixture.getType = this.sinon.stub().returns(42);

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    try {
      await deliverTxHandler(request);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Unknown State Transition');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });
});
