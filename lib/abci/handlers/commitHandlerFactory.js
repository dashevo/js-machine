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
 * @param {IdentityState} identityState
 * @param {IdentityLevelDBRepository} identityRepository
 *
 * @return {commitHandler}
 */
module.exports = function commitHandlerFactory(
  driveUpdateStateClient,
  blockchainState,
  blockchainStateRepository,
  identityState,
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

    const identityModels = identityState.getIdentityModels();
    if (identityModels.length) {
      await identityRepository.store(identityModels);

      identityState.reset();
    }

    return new ResponseCommit({
      data: appHash,
    });
  }

  return commitHandler;
};
