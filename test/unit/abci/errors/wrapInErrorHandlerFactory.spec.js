const wrapInErrorHandlerFactory = require('../../../../lib/abci/errors/wrapInErrorHandlerFactory');

const checkTxHandlerFactory = require('../../../../lib/abci/handlers/checkTxHandlerFactory');

const InternalAbciError = require('../../../../lib/abci/errors/InternalAbciError');
const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');

describe('wrapInErrorHandlerFactory', () => {
  let checkTxHandler;
  let decodeStateTransitionMock;
  let loggerMock;
  let request;

  beforeEach(function beforeEach() {
    request = {
      tx: Buffer.alloc(0),
    };

    loggerMock = {
      error: this.sinon.stub(),
    };

    const wrapInErrorHandler = wrapInErrorHandlerFactory(loggerMock);

    decodeStateTransitionMock = this.sinon.stub();

    checkTxHandler = wrapInErrorHandler(
      checkTxHandlerFactory(decodeStateTransitionMock),
    );
  });

  it('should respond with internal error code if any Error is thrown in handler', async () => {
    const error = new Error();

    decodeStateTransitionMock.throws(error);

    const response = await checkTxHandler(request);

    expect(response).to.deep.equal({
      code: 1,
      log: JSON.stringify({
        error: {
          message: 'Internal error',
        },
      }),
    });
  });

  it('should respond with internal error code if an InternalAbciError is thrown in handler', async () => {
    const data = { sample: 'data' };
    const error = new InternalAbciError(new Error(), data);

    decodeStateTransitionMock.throws(error);

    const response = await checkTxHandler(request);

    expect(response).to.deep.equal({
      code: error.getCode(),
      log: JSON.stringify({
        error: {
          message: error.getMessage(),
          data: error.getData(),
        },
      }),
    });
  });

  it('should respond with invalid argument error if it is thrown in handler', async () => {
    const data = { sample: 'data' };
    const error = new InvalidArgumentAbciError('test', data);

    decodeStateTransitionMock.throws(error);

    const response = await checkTxHandler(request);

    expect(response).to.deep.equal({
      code: error.getCode(),
      log: JSON.stringify({
        error: {
          message: error.getMessage(),
          data: error.getData(),
        },
      }),
    });
  });
});
