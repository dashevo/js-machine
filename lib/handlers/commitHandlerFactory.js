const types = require('abci/types');
const {
  CommitTransactionRequest,
} = require('@dashevo/drive-grpc');

/**
 * commit ABCI handler
 * @param {AppState} state
 * @param {UpdateStatePromiseClient} updateStateClient
 * @returns {commitHandler}
 */
module.exports = function commitHandlerFactory(state, updateStateClient) {
  /**
   * @typedef commitHandler
   * @param request
   * @returns {Promise<abci.ResponseCommit>}
   */
  async function commitHandler(request) {
    const commitTransactionRequest = new CommitTransactionRequest();
    commitTransactionRequest.setBlockHeight(state.getHeight());
    commitTransactionRequest.setBlockHash(state.getBlockHash());

    await updateStateClient.commitTransaction(commitTransactionRequest);

    let height = state.getHeight();

    height += 1;
    const appHash = Buffer.alloc(8);
    // @TODO figure out how to generate appHash
    appHash.writeUIntBE();

    state.setHeight(height);
    state.setAppHash(appHash);
    await state.saveState();

    return new types.abci.ResponseCommit({ data: appHash });
  }

  return commitHandler;
};
