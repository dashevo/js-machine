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
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const IdentityModel = require('@dashevo/dpp/lib/identity/model/IdentityModel');

const deliverTxHandlerFactory = require('../../../../lib/abci/handlers/deliverTxHandlerFactory');
const UpdateStatePromiseClientMock = require('../../../../lib/test/mock/UpdateStatePromiseClientMock');

const BlockchainState = require('../../../../lib/state/BlockchainState');

const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../lib/abci/errors/AbciError');

describe('deliverTxHandlerFactory', () => {
  let deliverTxHandler;
  let driveUpdateStateClient;
  let request;
  let blockHeight;
  let blockHash;
  let dppMock;
  let blockchainState;
  let stateTransitionFixture;
  let uncommittedIdentitiesMock;

  beforeEach(function beforeEach() {
    const dpp = new DashPlatformProtocol();
    const dataContractFixture = getDataContractFixture();
    uncommittedIdentitiesMock = {
      setIdentityModel: this.sinon.stub(),
    };
    stateTransitionFixture = dpp.dataContract.createStateTransition(dataContractFixture);

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    dppMock = createDPPMock(this.sinon);
    dppMock.stateTransition.createFromSerialized.resolves(stateTransitionFixture);

    blockHeight = 1;
    blockHash = Buffer.alloc(0);

    blockchainState = new BlockchainState(blockHeight);
    driveUpdateStateClient = new UpdateStatePromiseClientMock(this.sinon);

    deliverTxHandler = deliverTxHandlerFactory(
      dppMock,
      driveUpdateStateClient,
      blockchainState,
      uncommittedIdentitiesMock,
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

    expect(uncommittedIdentitiesMock.setIdentityModel).to.be.not.called();
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
      stateTransitionFixture.toJSON(),
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

  it.skip('should set identity model if ST has IDENTITY_CREATE type', async () => {
    // @TODO implement state transition fixture with IDENTITY_CREATE type
    await deliverTxHandler(request);

    const identityModel = new IdentityModel();
    identityModel.applyStateTransition(stateTransitionFixture);

    expect(uncommittedIdentitiesMock.setIdentityModel).to.be.calledWith(identityModel);
    expect(driveUpdateStateClient.applyStateTransition).to.be.not.called();
  });
});
