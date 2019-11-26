const {
  abci: {
    ResponseEndBlock,
  },
} = require('abci/types');

/**
 * End block ABCI handler
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory() {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestEndBlock} request
   * @return {Promise<abci.ResponseEndBlock>}
   */
  // eslint-disable-next-line no-unused-vars
  async function endBlockHandler(request) {
    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
