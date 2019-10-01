const infoHandlerFactory = require('../../../lib/handlers/infoHandlerFactory');
const wrapInErrorHandlerFactory = require('../../../lib/handlers/errors/wrapInErrorHandlerFactory.js');

describe('infoHandlerFactory', () => {
  let infoHandler;
  let appStateMock;

  beforeEach(function beforeEach () {
    appStateMock = {
      getHeight: this.sinon.stub().returns(0),
      getAppHash: this.sinon.stub().returns(null),
    };

    infoHandler = infoHandlerFactory(appStateMock);
  });

  it('should return valid result', async () => {
    const result = await infoHandler();

    expect(result).to.deep.equal({
      data: 'Dash ABCI JS State Machine',
      version: '0.1.0',
      lastBlockHeight: 0,
      lastBlockAppHash: null,
    });
  });
});
