const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

/**
 * @param {unserializeStateTransition} unserializeStateTransition
 *
 * @returns {checkTxHandler}
 */
function checkTxHandlerFactory(
  unserializeStateTransition,
) {
  /**
   * CheckTx ABCI handler
   *
   * @typedef checkTxHandler
   *
   * @param {abci.RequestCheckTx} request
   *
   * @returns {Promise<abci.ResponseCheckTx>}
   */
  async function checkTxHandler({ tx: stateTransitionByteArray }) {
    await unserializeStateTransition(stateTransitionByteArray);

    return new ResponseCheckTx();
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
