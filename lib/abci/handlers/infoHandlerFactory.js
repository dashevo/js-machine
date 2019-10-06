const {
  abci: {
    ResponseInfo,
  },
} = require('abci/types');

const packageJson = require('./../../../package');


/**
 * @param {BlockchainState} blockchainState
 * @returns {infoHandler}
 */
module.exports = function infoHandlerFactory(blockchainState) {
  /**
   * Info ABCI handler
   *
   * @typedef infoHandler
   *
   * @returns {Promise<ResponseInfo>}
   */
  async function infoHandler() {
    return new ResponseInfo({
      version: packageJson.version,
      lastBlockHeight: blockchainState.getLastBlockHeight(),
      lastBlockAppHash: blockchainState.getLastBlockAppHash(),
    });
  }

  return infoHandler;
};
