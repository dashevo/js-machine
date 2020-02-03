const createDataContract = require('@dashevo/dpp/lib/dataContract/createDataContract');

class MachineDataProvider {
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
   * @return {Promise<DataContract|null>}
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

  /**
   *  Fetch Identity by id, including unconfirmed ones
   *
   * @param {string} id
   * @return {Promise<null|Identity>}
   */
  async fetchIdentity(id) {
    return this.identityRepository.fetch(id);
  }
}

module.exports = MachineDataProvider;
