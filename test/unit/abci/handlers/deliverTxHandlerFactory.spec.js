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

const getRequestTxFixture = require('../../../../lib/test/fixtures/getRequestTxFixture');
const getStHeaderFixture = require('../../../../lib/test/fixtures/getStHeaderFixture');
const getStPacketFixture = require('../../../../lib/test/fixtures/getStPacketFixture');

const BlockchainState = require('../../../../lib/state/BlockchainState');

describe('deliverTxHandlerFactory', () => {
  let deliverTxHandler;
  let driveUpdateStateClient;
  let request;
  let blockHeight;
  let blockHash;
  let decodeStateTransitionMock;
  let blockchainState;
  let stPacketFixture;
  let stHeaderFixture;

  beforeEach(function beforeEach() {
    stPacketFixture = getStPacketFixture();
    stHeaderFixture = getStHeaderFixture(stPacketFixture);
    const requestTxFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);

    request = {
      tx: requestTxFixture,
    };

    decodeStateTransitionMock = this.sinon.stub().resolves({
      stHeader: stHeaderFixture,
      stPacket: stPacketFixture,
    });

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

    applyStateTransitionRequest.setStateTransitionPacket(
      stPacketFixture.serialize(),
    );

    applyStateTransitionRequest.setStateTransitionHeader(
      Buffer.from(stHeaderFixture.serialize(), 'hex'),
    );

    expect(response).to.be.an.instanceOf(ResponseDeliverTx);
    expect(response.code).to.equal(0);

    expect(driveUpdateStateClient.applyStateTransition).to.be.calledOnceWith(
      applyStateTransitionRequest,
    );
  });
});
