class DataProvider {
  /**
   *
   * @param {RpcClient} dashCoreClient
   * @param {jaysonClient} driveClient
   */
  constructor(dashCoreClient, driveClient) {
    this.dashCoreClient = dashCoreClient;
    this.driveClient = driveClient;
  }

  async fetchContract(id) {
    return this.driveClient.fetchContract(id);
  }

  async fetchDocuments(contractId, type, options = {}) {
    return this.driveClient.fetchDocuments(contractId, type, options);
  }

  async fetchTransaction(id) {
    try {
      return await this.dashCoreClient.getRawTransaction(id);
    } catch (e) {
      // Invalid address or key error
      if (e.code === -5) {
        return null;
      }

      throw e;
    }
  }
}

module.exports = DataProvider;

