class JsMachineAbciAppOptions {
  constructor(options) {
    this.storageMongoDbUrl = options.STORAGE_MONGODB_URL;
    this.storageMongoDbDatabase = options.STORAGE_MONGODB_DB;
    this.abciServerHost = options.ABCI_SERVER_HOST;
    this.abciServerPort = options.ABCI_SERVER_PORT;
    this.updateStateApiGrpcHost = options.UPDATE_STATE_API_GRPC_HOST;
    this.updateStateApiGrpcPort = options.UPDATE_STATE_API_GRPC_PORT;
    this.dashCoreJsonRpcHost = options.DASHCORE_JSON_RPC_HOST;
    this.dashCoreJsonRpcPort = options.DASHCORE_JSON_RPC_PORT;
    this.dashCoreJsonRpcUser = options.DASHCORE_JSON_RPC_USER;
    this.dashCoreJsonRpcPass = options.DASHCORE_JSON_RPC_PASS;
    this.driveJsonRpcHost = options.DRIVE_JSON_RPC_HOST;
    this.driveJsonRpcPort = options.DRIVE_JSON_RPC_PORT;
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

  getDashCoreJsonRpcHost() {
    return this.dashCoreJsonRpcHost;
  }

  getDashCoreJsonRpcPort() {
    return this.dashCoreJsonRpcPort;
  }

  getDashCoreJsonRpcUser() {
    return this.dashCoreJsonRpcUser;
  }

  getDashCoreJsonRpcPass() {
    return this.dashCoreJsonRpcPass;
  }

  getDriveJsonRpcHost() {
    return this.driveJsonRpcHost;
  }

  getDriveJsonRpcPort() {
    return this.driveJsonRpcPort;
  }
}

module.exports = JsMachineAbciAppOptions;
