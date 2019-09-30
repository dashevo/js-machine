class JsMachineAbciAppOptions {
  constructor(options) {
    this.storageMongoDbUrl = options.STORAGE_MONGODB_URL;
    this.storageMongoDbDatabase = options.STORAGE_MONGODB_DB;
    this.abciServerHost = options.ABCI_SERVER_HOST;
    this.abciServerPort = options.ABCI_SERVER_PORT;
    this.updateStateApiGrpcHost = options.UPDATE_STATE_API_GRPC_HOST;
    this.updateStateApiGrpcPort = options.UPDATE_STATE_API_GRPC_PORT;
  }

  getStorageMongoDbUrl() {
    return this.storageMongoDbUrl;
  }

  getStorageMongoDbDatabase() {
    return this.storageMongoDbDatabase;
  }

  getAbciServerHost() {
    return this.abciServerHost;
  }

  getAbciServerPort() {
    return this.abciServerPort;
  }

  getUpdateStateApiGrpcHost() {
    return this.updateStateApiGrpcHost;
  }

  getUpdateStateApiGrpcPort() {
    return this.updateStateApiGrpcPort;
  }
}

module.exports = JsMachineAbciAppOptions;


