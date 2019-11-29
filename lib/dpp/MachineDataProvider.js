class MachineDataProvider {
  /**
   * @param {ClientHttp} driveApiClient
   * @param {LRUCache} contractCache
   * @param {IdentityLevelDBRepository} identityRepository
   * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
   */
  constructor(driveApiClient, contractCache, identityRepository, blockExecutionDBTransactions) {
    this.driveApiClient = driveApiClient;
    this.contractCache = contractCache;
    this.identityRepository = identityRepository;
    this.blockExecutionDBTransactions = blockExecutionDBTransactions;
  }

  /**
   * Fetch Contract by ID
   *
   * @param {string} id
   * @return {Promise<Contract|null>}
   */
  async fetchContract(id) {
    let contract = this.contractCache.get(id);

    if (contract) {
      return contract;
    }

    contract = await this.driveApiClient.fetchContract(id);

    this.contractCache.set(id, contract);

    return contract;
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

module.exports = MachineDataProvider;
