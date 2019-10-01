const AbciError = require('./AbciError');

function respondWithError(code, message, data) {
  return { code, log: { message, data } };
}

/**
 * @param {Object} logger
 * @return wrapInErrorHandler
 */
module.exports = function wrapInErrorHandlerFactory(logger) {
  /**
   * Wrap ABCI methods in error handler
   *
   * @typedef wrapInErrorHandler
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
        logger.error(e);

        let code = AbciError.CODES.COMMON;
        let data = e;

        if (e instanceof AbciError) {
          code = e.getCode();
          data = e.getData();
        }

        return respondWithError(code, e.message, data);
      }
    }

    return methodErrorHandler;
  }

  return wrapInErrorHandler;
};
