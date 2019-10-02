const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');
const {
  CommitTransactionRequest,
} = require('@dashevo/drive-grpc');

const commitHandlerFactory = require('../../../lib/handlers/commitHandlerFactory');
const AppStateMock = require('../../../lib/test/mock/AppStateMock');
const UpdateStateClientMock = require('../../../lib/test/mock/UpdateStateClientMock');

describe('commitHandlerFactory', () => {
  let commitHandler;
  let appStateMock;
  let updateStateClientMock;
  let height;
  let blockHash;

  beforeEach(function beforeEach() {
    height = 1;
    blockHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';

    appStateMock = new AppStateMock(this.sinon);
    appStateMock.getHeight.returns(height);
    appStateMock.getBlockHash.returns(blockHash);

    updateStateClientMock = new UpdateStateClientMock(this.sinon);

    commitHandler = commitHandlerFactory(appStateMock, updateStateClientMock);
  });

  it('should return valid result', async () => {
    const result = await commitHandler();

    const appHash = Buffer.alloc(8);
    const commitTransactionRequest = new CommitTransactionRequest();
    commitTransactionRequest.setBlockHeight(height);
    commitTransactionRequest.setBlockHash(blockHash);

    expect(appStateMock.getHeight).to.be.calledOnce();
    expect(appStateMock.setAppHash).to.be.calledOnceWith(appHash);
    expect(appStateMock.setHeight).to.be.calledOnceWith(height + 1);
    expect(updateStateClientMock.commitTransaction).to.be.calledOnceWith(commitTransactionRequest);
    expect(result).to.be.an.instanceOf(ResponseCommit);
    expect(result).to.deep.include({
      data: appHash,
    });
  });
});
