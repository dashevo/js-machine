/**
 * info ABCI handler
 * @param {AppState} state
 * @returns {infoHandler}
 */
module.exports = function infoHandlerFactory(state) {
  /**
   * @typedef infoHandler
   * @param request
   * @returns {Promise<{lastBlockHeight: number, data: string, lastBlockAppHash: Buffer, version: string}>}
   */
  async function infoHandler(request) {
    const lastBlockHeight = state.getHeight();
    const lastBlockAppHash = state.getAppHash();

    return {
      data: 'Dash ABCI JS State Machine',
      version: '0.1.0',
      lastBlockHeight,
      lastBlockAppHash,
    };
  }

  return infoHandler;
};
