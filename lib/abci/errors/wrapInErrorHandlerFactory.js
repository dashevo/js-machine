const AbciError = require('./AbciError');
const InternalAbciError = require('./InternalAbciError');

/**
 * @param {Object} logger
 *
 * @return wrapInErrorHandler
 */
module.exports = function wrapInErrorHandlerFactory(logger) {
  /**
   * Wrap ABCI methods in error handler
   *
   * @typedef wrapInErrorHandler
   *
   * @param {Function} method
   * @return {Function}
   */
  function wrapInErrorHandler(method) {
    /**
     * @param request
     */
    async function methodErrorHandler(request) {
      try {
        return await method(request);
      } catch (e) {
        let error = e;

        // Wrap all non ABCI errors to an internal ABCI error
        if (!(e instanceof AbciError)) {
          error = new InternalAbciError(e);
        }

        // Log only internal ABCI errors
        if (e instanceof InternalAbciError) {
          logger.error(e.getError());
        }

        return {
          code: error.getCode(),
          log: JSON.stringify({
            error: {
              message: error.getMessage(),
              data: error.getData(),
            },
          }),
        };
      }
    }

    return methodErrorHandler;
  }

  return wrapInErrorHandler;
};