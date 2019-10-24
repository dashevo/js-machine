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
  async function beginBlockHandler({ header: { height } }) {
    blockchainState.setLastBlockHeight(height);

    const startTransactionRequest = new StartTransactionRequest();
    startTransactionRequest.setBlockHeight(height);

    await driveUpdateStateClient.startTransaction(startTransactionRequest);

    return new ResponseBeginBlock();
  }

  return beginBlockHandler;
};
