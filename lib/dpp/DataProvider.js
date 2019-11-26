class DataProvider {
  /**
   * @param {ClientHttp} driveApiClient
   * @param {LRUCache} contractCache
   * @param {IdentityLevelDBRepository} identityRepository
   */
  constructor(driveApiClient, contractCache, identityRepository) {
    this.driveApiClient = driveApiClient;
    this.contractCache = contractCache;
    this.identityRepository = identityRepository;
  }

  /**
   * Fetch Contract by ID
   *
   * @param {string} id
   * @returns {Promise<Contract|null>}
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
   * @param {LevelDBTransaction} transaction
   * @returns {Promise<null|Identity>}
   */
  async fetchIdentity(id, transaction) {
    return this.identityRepository.fetch(id, transaction);
  }
}

module.exports = DataProvider;
