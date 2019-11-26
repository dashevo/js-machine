const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');

const {
  CommitTransactionRequest,
} = require('@dashevo/drive-grpc');

/**
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 * @param {BlockchainStateLevelDBRepository} blockchainStateRepository
 * @param {IdentityLevelDBRepository} identityRepository
 *
 * @return {commitHandler}
 */
function commitHandlerFactory(
  driveUpdateStateClient,
  blockchainState,
  blockchainStateRepository,
  identityRepository,
) {
  /**
   * Commit ABCI handler
   *
   * @typedef commitHandler
   *
   * @return {Promise<abci.ResponseCommit>}
   */
  async function commitHandler() {
    const commitTransactionRequest = new CommitTransactionRequest();
    commitTransactionRequest.setBlockHeight(blockchainState.getLastBlockHeight());
    commitTransactionRequest.setBlockHash(Buffer.alloc(0));

    await driveUpdateStateClient.commitTransaction(commitTransactionRequest);

    const appHash = Buffer.alloc(0);

    blockchainState.setLastBlockAppHash(appHash);

    await blockchainStateRepository.store(blockchainState);

    await identityRepository.commit();

    return new ResponseCommit({
      data: appHash,
    });
  }

  return commitHandler;
}

module.exports = commitHandlerFactory;
