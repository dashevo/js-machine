const { MongoClient } = require('mongodb');
const DashPlatformProtocol = require('@dashevo/dpp');
const { UpdateStatePromiseClient } = require('drive-grpc');

const checkTxHandlerFactory = require('../handlers/checkTxHandlerFactory');
const commitHandlerFactory = require('../handlers/commitHandlerFactory');
const deliverTxHandlerFactory = require('../handlers/deliverTxHandlerFactory');
const infoHandlerFactory = require('../handlers/infoHandlerFactory');
const beginBlockHandlerFactory = require('../handlers/beginBlockHandlerFactory');
const AppState = require('./AppState');

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
  }

  /**
   * Create handlers for ABCI server
   * @returns {{checkTx: Function, deliverTx: Function, commit: Function, info: Function}}
   */
  createHandlers() {
    const dpp = new DashPlatformProtocol();

    const { options, appState } = this;
    const updateStateClient = new UpdateStatePromiseClient(`${options.getUpdateStateApiGrpcHost()}:${options.getUpdateStateApiGrpcPort()}`);

    const info = infoHandlerFactory(appState);
    const beginBlock = beginBlockHandlerFactory(appState, updateStateClient);
    const checkTx = checkTxHandlerFactory(dpp);
    const deliverTx = deliverTxHandlerFactory();
    const commit = commitHandlerFactory();

    return {
      info,
      beginBlock,
      checkTx,
      deliverTx,
      commit,
    };
  }
}

module.exports = JsMachineAbciApp;
