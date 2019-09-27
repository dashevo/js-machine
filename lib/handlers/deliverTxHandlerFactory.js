const types = require('abci/types');

/**
 * deliverTx ABCI handler
 * @returns {deliverTxHandler}
 */
module.exports = function deliverTxHandlerFactory() {
  /**
   * @typedef deliverTxHandler
   * @param request
   * @returns {Promise<abci.ResponseDeliverTx>}
   */
  async function deliverTxHandler(request) {
    // @TODO figure out how to share state between handlers
    // state.size += 1;

    return new types.abci.ResponseDeliverTx({ code: 0, log: 'tx succeeded' });
  }

  return deliverTxHandler;
};
