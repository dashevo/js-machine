class JsMachineAbciAppOptions {
  constructor(options) {
    this.storageMongoDbUrl = options.STORAGE_MONGODB_URL;
    this.storageMongoDbDatabase = options.STORAGE_MONGODB_DB;
    this.abciHost = options.ABCI_HOST;
    this.abciPort = options.ABCI_PORT;
  }

  getStorageMongoDbUrl() {
    return this.storageMongoDbUrl;
  }

  getStorageMongoDbDatabase() {
    return this.storageMongoDbDatabase;
  }

  getAbciHost() {
    return this.abciHost;
  }

  getAbciPort() {
    return this.abciPort;
  }
}

module.exports = JsMachineAbciAppOptions;


