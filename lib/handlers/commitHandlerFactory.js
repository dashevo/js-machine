const types = require('abci/types');

/**
 * commit ABCI handler
 * @param {AppState} state
 * @returns {commitHandler}
 */
module.exports = function commitHandlerFactory(state) {
  /**
   * @typedef commitHandler
   * @param request
   * @returns {Promise<abci.ResponseCommit>}
   */
  async function commitHandler(request) {
    let height = state.getHeight();

    height += 1;
    const appHash = Buffer.alloc(8);
    // @TODO figure out how to generate appHash. (data for appHash probably is inside deliverTx)
    appHash.writeUIntBE();

    state.setHeight(height);
    state.setAppHash(appHash);
    await state.saveState();

    return new types.abci.ResponseCommit({ code: 0, log: 'tx succeeded' });
  }

  return commitHandler;
};
