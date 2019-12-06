const MachineDataProvider = require('./MachineDataProvider');

class TransactionalMachineDataProvider extends MachineDataProvider {
  /**
   * @param {ClientHttp} driveApiClient
   * @param {LRUCache} contractCache
   * @param {IdentityLevelDBRepository} identityRepository
   * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
   */
  constructor(driveApiClient, contractCache, identityRepository, blockExecutionDBTransactions) {
    super(driveApiClient, contractCache, identityRepository);

    this.blockExecutionDBTransactions = blockExecutionDBTransactions;
  }

  /**
   *  Fetch Identity by id, including unconfirmed ones
   *
   * @param {string} id
   * @return {Promise<null|Identity>}
   */
  async fetchIdentity(id) {
    const identityTransaction = this.blockExecutionDBTransactions.getIdentityTransaction();

    return this.identityRepository.fetch(id, identityTransaction);
  }
}

module.exports = TransactionalMachineDataProvider;
