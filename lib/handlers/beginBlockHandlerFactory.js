const types = require('abci/types');
const {
  StartTransactionRequest,
} = require('@dashevo/drive-grpc');

/**
 * beginBlock ABCI handler
 * @param {AppState} state
 * @param {UpdateStatePromiseClient} updateStateClient
 * @returns {beginBlockHandler}
 */
module.exports = function beginBlockHandlerFactory(state, updateStateClient) {
  /**
   * @typedef beginBlockHandler
   * @param request
   * @returns {Promise<abci.ResponseDeliverTx>}
   */
  async function beginBlockHandler(request) {
    const startTransactionRequest = new StartTransactionRequest();
    startTransactionRequest.setBlockHeight(state.getHeight());

    const result = await updateStateClient.startTransaction(startTransactionRequest);

    // @TODO check result

    return new types.abci.ResponseBeginBlock({ code: 0, log: '' });
  }

  return beginBlockHandler;
};
