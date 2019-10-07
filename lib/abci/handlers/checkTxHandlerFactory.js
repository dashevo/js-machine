const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

/**
 * @param {decodeStateTransition} decodeStateTransition
 * @returns {checkTxHandler}
 */
function checkTxHandlerFactory(decodeStateTransition) {
  /**
   * CheckTx ABCI handler
   *
   * @typedef checkTxHandler
   *
   * @param {abci.RequestCheckTx} request
   * @returns {Promise<abci.ResponseCheckTx>}
   */
  async function checkTxHandler(request) {
    await decodeStateTransition(request.tx);

    return new ResponseCheckTx();
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
