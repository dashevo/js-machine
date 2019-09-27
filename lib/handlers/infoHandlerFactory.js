/**
 * info ABCI handler
 * @param state {AppState}
 * @returns {infoHandler}
 */
module.exports = function infoHandlerFactory(state) {
  /**
   * @typedef infoHandler
   * @param request
   * @returns {Promise<{lastBlockHeight: number, data: string, lastBlockAppHash: Buffer, version: string}>}
   */
  async function infoHandler(request) {
    const { height, appHash } = await state.getState();

    return {
      data: 'Dash ABCI JS State Machine',
      version: '0.1.0',
      lastBlockHeight: height || 0,
      lastBlockAppHash: height === 0 ? undefined : appHash,
    };
  }

  return infoHandler;
};
