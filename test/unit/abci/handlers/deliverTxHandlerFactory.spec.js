const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const deliverTxHandlerFactory = require('../../../../lib/abci/handlers/deliverTxHandlerFactory');
const UpdateStatePromiseClientMock = require('../../../../lib/test/mock/UpdateStatePromiseClientMock');

const getDataContractFixture = require('../../../../lib/test/fixtures/getDataContractFixture');
const getDataContractStateTransitionFixture = require('../../../../lib/test/fixtures/getDataContractStateTransitionFixture');

const BlockchainState = require('../../../../lib/state/BlockchainState');

describe('deliverTxHandlerFactory', () => {
  let deliverTxHandler;
  let driveUpdateStateClient;
  let request;
  let blockHeight;
  let blockHash;
  let decodeStateTransitionMock;
  let blockchainState;
  let stateTransitionFixture;

  beforeEach(async function beforeEach() {
    const dataContractFixture = getDataContractFixture();
    stateTransitionFixture = await getDataContractStateTransitionFixture(dataContractFixture);

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    decodeStateTransitionMock = this.sinon.stub().resolves(stateTransitionFixture);

    blockHeight = 1;
    blockHash = Buffer.alloc(0);

    blockchainState = new BlockchainState(blockHeight);
    driveUpdateStateClient = new UpdateStatePromiseClientMock(this.sinon);

    deliverTxHandler = deliverTxHandlerFactory(
      decodeStateTransitionMock,
      driveUpdateStateClient,
      blockchainState,
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
  });
});
