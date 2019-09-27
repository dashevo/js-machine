const types = require('abci/types');

/**
 * checkTx ABCI handler
 * @returns {checkTxHandler}
 */
module.exports = function checkTxHandlerFactory() {
  /**
   * @typedef checkTxHandler
   * @param request
   * @returns {Promise<abci.ResponseCheckTx>}
   */
  async function checkTxHandler(request) {
    return new types.abci.ResponseCheckTx({ code: 0, log: 'tx succeeded', gasWanted: 1 });
  }

  return checkTxHandler;
};
