const {
  abci: {
    ResponseBeginBlock,
  },
} = require('abci/types');
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

    state.setBlockHash(Buffer.from(request.hash, 'base64').toString('hex'));

    await updateStateClient.startTransaction(startTransactionRequest);

    return new ResponseBeginBlock();
  }

  return beginBlockHandler;
};
