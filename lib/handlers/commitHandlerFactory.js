const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');
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
   * @returns {Promise<abci.ResponseCommit>}
   */
  async function commitHandler() {
    let height = state.getHeight();

    const commitTransactionRequest = new CommitTransactionRequest();
    commitTransactionRequest.setBlockHeight(height);
    commitTransactionRequest.setBlockHash(state.getBlockHash());

    await updateStateClient.commitTransaction(commitTransactionRequest);
    const appHash = Buffer.alloc(8);
    // @TODO figure out how to generate appHash
    appHash.writeUIntBE();

    height += 1;

    state.setHeight(height);
    state.setAppHash(appHash);
    await state.saveState();

    return new ResponseCommit({ data: appHash });
  }

  return commitHandler;
};
