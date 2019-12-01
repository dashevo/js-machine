const createDataContract = require('@dashevo/dpp/lib/dataContract/createDataContract');

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
   * @returns {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    let dataContract = this.contractCache.get(id);

    if (dataContract) {
      return dataContract;
    }

    const { result: rawDataContract, error } = await this.driveApiClient.request(
      'fetchContract',
      { contractId: id },
    );

    if (error) {
      if (error.code === -32602) {
        return null;
      }

      throw new Error(`Can't fetch contract: ${error.message}`);
    }

    dataContract = createDataContract(rawDataContract);

    this.contractCache.set(id, dataContract);

    return dataContract;
  }
}

module.exports = DataProvider;
