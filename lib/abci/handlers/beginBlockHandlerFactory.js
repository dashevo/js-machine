const {
  abci: {
    ResponseBeginBlock,
  },
} = require('abci/types');

const {
  StartTransactionRequest,
} = require('@dashevo/drive-grpc');

/**
 * Begin block ABCI handler
 *
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 *
 * @returns {beginBlockHandler}
 */
module.exports = function beginBlockHandlerFactory(driveUpdateStateClient, blockchainState) {
  /**
   * @typedef beginBlockHandler
   *
   * @param {abci.RequestBeginBlock} request
   * @returns {Promise<abci.ResponseBeginBlock>}
   */
  async function beginBlockHandler(request) {
    blockchainState.setLastBlockHeight(request.header.height);

    const startTransactionRequest = new StartTransactionRequest();
    startTransactionRequest.setBlockHeight(request.header.height);

    await driveUpdateStateClient.startTransaction(startTransactionRequest);

    return new ResponseBeginBlock();
  }

  return beginBlockHandler;
};
