const {
  abci: {
    ResponseBeginBlock,
  },
} = require('abci/types');

const {
  StartTransactionRequest,
} = require('@dashevo/drive-grpc');

const beginBlockHandlerFactory = require('../../../../lib/abci/handlers/beginBlockHandlerFactory');

const BlockchainState = require('../../../../lib/state/BlockchainState');
const UpdateStatePromiseClientMock = require('../../../../lib/test/mock/UpdateStatePromiseClientMock');

describe('beginBlockHandlerFactory', () => {
  let beginBlockHandler;
  let request;
  let blockchainState;
  let driveUpdateStateClientMock;
  let blockHeight;

  beforeEach(function beforeEach() {
    blockchainState = new BlockchainState();
    driveUpdateStateClientMock = new UpdateStatePromiseClientMock(this.sinon);

    beginBlockHandler = beginBlockHandlerFactory(
      driveUpdateStateClientMock,
      blockchainState,
    );

    blockHeight = 2;

    request = {
      header: {
        height: blockHeight,
      },
    };
  });

  it('should start transaction and return ResponseBeginBlock', async () => {
    const startTransactionRequest = new StartTransactionRequest();
    startTransactionRequest.setBlockHeight(blockHeight);

    const response = await beginBlockHandler(request);

    expect(response).to.be.an.instanceOf(ResponseBeginBlock);

    expect(blockchainState.getLastBlockHeight()).to.equal(blockHeight);

    expect(driveUpdateStateClientMock.startTransaction).to.be.calledOnceWith(
      startTransactionRequest,
    );
  });
});
