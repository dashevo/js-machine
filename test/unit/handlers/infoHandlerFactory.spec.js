const {
  abci: {
    ResponseInfo,
  },
} = require('abci/types');
const infoHandlerFactory = require('../../../lib/handlers/infoHandlerFactory');
const AppState = require('../../../lib/test/mock/AppStateMock');

describe('infoHandlerFactory', () => {
  let infoHandler;
  let appStateMock;

  beforeEach(function beforeEach() {
    appStateMock = new AppState(this.sinon);

    appStateMock.getHeight.returns(0);
    appStateMock.getAppHash.returns(0);

    infoHandler = infoHandlerFactory(appStateMock);
  });

  it('should return valid result', async () => {
    const result = await infoHandler();

    expect(appStateMock.getHeight).to.be.calledOnce();
    expect(appStateMock.getAppHash).to.be.calledOnce();
    expect(result).to.deep.include({
      data: 'Dash ABCI JS State Machine',
      version: '0.1.0',
      lastBlockHeight: 0,
      lastBlockAppHash: 0,
    });
    expect(result).to.be.an.instanceOf(ResponseInfo);
  });
});
