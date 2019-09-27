const types = require('abci/types');

/**
 * commit ABCI handler
 * @param state {AppState}
 * @returns {commitHandler}
 */
module.exports = function commitHandlerFactory(state) {
  /**
   * @typedef commitHandler
   * @param request
   * @returns {Promise<abci.ResponseCommit>}
   */
  async function commitHandler(request) {
    let { height, size } = await state.getState();

    height += 1;
    const appHash = Buffer.alloc(8);
    appHash.writeUIntBE(size);

    await state.saveState(height, appHash, size);

    return new types.abci.ResponseCommit({ code: 0, log: 'tx succeeded' });
  }

  return commitHandler;
};
