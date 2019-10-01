const { promisify } = require('util');
const { MongoClient } = require('mongodb');
const DashPlatformProtocol = require('@dashevo/dpp');
const { UpdateStatePromiseClient } = require('@dashevo/drive-grpc');
const DashCoreClient = require('@dashevo/dashd-rpc/promise');
const { client: driveClient } = require('jayson');

const checkTxHandlerFactory = require('../handlers/checkTxHandlerFactory');
const commitHandlerFactory = require('../handlers/commitHandlerFactory');
const deliverTxHandlerFactory = require('../handlers/deliverTxHandlerFactory');
const infoHandlerFactory = require('../handlers/infoHandlerFactory');
const beginBlockHandlerFactory = require('../handlers/beginBlockHandlerFactory');
const AppState = require('./AppState');
const wrapInErrorHandlerFactory = require('../handlers/errors/wrapInErrorHandlerFactory');
const errorHandler = require('../util/errorHandler');
const DataProvider = require('../dpp/DataProvider');

/**
 * JS machine ABCI application
 */
class JsMachineAbciApp {
  /**
   *
   * @param {JsMachineAbciAppOptions} options
   */
  constructor(options) {
    this.options = options;
    this.mongoClient = null;
    this.mongoDb = null;
    this.appState = null;
    this.dashCoreClient = null;
    this.driveClient = null;
  }

  /**
   * Init JsMachineAbciApp
   * @returns {Promise<void>}
   */
  async init() {
    this.mongoClient = await MongoClient.connect(
      this.options.getStorageMongoDbUrl(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    this.mongoDb = this.mongoClient.db(this.options.getStorageMongoDbDatabase());
    this.appState = new AppState(this.mongoDb);
    await this.appState.init();

    this.dashCoreClient = new DashCoreClient({
      protocol: 'http',
      host: this.options.getDashCoreJsonRpcHost(),
      port: this.options.getDashCoreJsonRpcPort(),
      user: this.options.getDashCoreJsonRpcUser(),
      pass: this.options.getDashCoreJsonRpcPass(),
    });

    this.driveClient = driveClient.http({
      host: this.options.getDriveJsonRpcHost(),
      port: this.options.getDriveJsonRpcPort(),
    });
    this.driveClient.request = promisify(this.driveClient.request.bind(this.driveClient));
  }

  /**
   * Create handlers for ABCI server
   * @returns {{checkTx: Function, deliverTx: Function, commit: Function, info: Function}}
   */
  createHandlers() {
    const dataProvider = new DataProvider(
      this.dashCoreClient,
      this.driveClient,
    );

    const dpp = new DashPlatformProtocol();
    dpp.setDataProvider(dataProvider);

    const { options, appState } = this;
    const updateStateClient = new UpdateStatePromiseClient(`${options.getUpdateStateApiGrpcHost()}:${options.getUpdateStateApiGrpcPort()}`);

    const info = infoHandlerFactory(appState);
    const beginBlock = beginBlockHandlerFactory(appState, updateStateClient);
    const checkTx = checkTxHandlerFactory(dpp);
    const deliverTx = deliverTxHandlerFactory(dpp, appState);
    const commit = commitHandlerFactory(appState, updateStateClient);

    return {
      info: this.createWrappedHandler(info),
      beginBlock: this.createWrappedHandler(beginBlock),
      checkTx: this.createWrappedHandler(checkTx),
      deliverTx: this.createWrappedHandler(deliverTx),
      commit: this.createWrappedHandler(commit),
    };
  }

  createWrappedHandler(handler) {
    const wrapInErrorHandler = wrapInErrorHandlerFactory({
      error: errorHandler,
    });

    return wrapInErrorHandler(handler);
  }
}

module.exports = JsMachineAbciApp;
