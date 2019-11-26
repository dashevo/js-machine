class DataProvider {
  /**
   * @param {ClientHttp} driveApiClient
   * @param {LRUCache} contractCache
   */
  constructor(driveApiClient, contractCache) {
    this.driveApiClient = driveApiClient;
    this.contractCache = contractCache;
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
}

module.exports = DataProvider;
