const createDataContract = require('@dashevo/dpp/lib/dataContract/createDataContract');

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
    const identityTransaction = this.blockExecutionDBTransactions.getIdentityTransaction();

    return this.identityRepository.fetch(id, identityTransaction);
  }
}

module.exports = MachineDataProvider;
