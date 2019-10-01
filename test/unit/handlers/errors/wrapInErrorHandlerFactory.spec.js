const wrapInErrorHandlerFactory = require('../../../../lib/handlers/errors/wrapInErrorHandlerFactory');
const infoHandlerFactory = require('../../../../lib/handlers/infoHandlerFactory');

describe('wrapInErrorHandlerFactory', () => {
  let infoHandler;
  let appStateMock;

  beforeEach(function beforeEach() {
    appStateMock = {
      getHeight: this.sinon.stub().returns(0),
      getAppHash: this.sinon.stub().returns(null),
    };

    infoHandler = infoHandlerFactory(appStateMock);
  });

  it('should handle ABCI handler error', async () => {
    const error = new Error('Some error');
    appStateMock.getHeight.throws(error);

    const wrapInErrorHandler = wrapInErrorHandlerFactory({
      error: () => {},
    });

    const wrappedInfoHandler = wrapInErrorHandler(infoHandler);

    const result = await wrappedInfoHandler();

    expect(result).to.deep.equal({
      code: 1,
      log: {
        message: error.message,
        data: error,
      },
    });
  });
});
