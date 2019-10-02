const {
  abci: {
    ResponseBeginBlock,
  },
} = require('abci/types');
const {
  StartTransactionRequest,
} = require('@dashevo/drive-grpc');

const beginBlockHandlerFactory = require('../../../lib/handlers/beginBlockHandlerFactory');
const AppStateMock = require('../../../lib/test/mock/AppStateMock');
const UpdateStateClientMock = require('../../../lib/test/mock/UpdateStateClientMock');

describe('beginBlockHandlerFactory', () => {
  let beginBlockHandler;
  let request;
  let appStateMock;
  let updateStateClientMock;

  beforeEach(function beforeEach() {
    appStateMock = new AppStateMock(this.sinon);
    updateStateClientMock = new UpdateStateClientMock(this.sinon);

    beginBlockHandler = beginBlockHandlerFactory(appStateMock, updateStateClientMock);

    request = {
      hash: 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75',
    };
  });

  it('should return valid result', async () => {
    const height = 1;
    appStateMock.getHeight.returns(height);

    const startTransactionRequest = new StartTransactionRequest();
    startTransactionRequest.setBlockHeight(height);

    const result = await beginBlockHandler(request);

    expect(appStateMock.setBlockHash).to.be.calledOnce();
    expect(appStateMock.setBlockHash).to.be.calledOnceWith(Buffer.from(request.hash, 'base64').toString('hex'));
    expect(updateStateClientMock.startTransaction).to.be.calledOnceWith(startTransactionRequest);
    expect(result).to.be.an.instanceOf(ResponseBeginBlock);
  });
});
