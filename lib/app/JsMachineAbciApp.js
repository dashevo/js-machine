const { MongoClient } = require('mongodb');

const checkTxHandlerFactory = require('../handlers/checkTxHandlerFactory');
const commitHandlerFactory = require('../handlers/commitHandlerFactory');
const deliverTxHandlerFactory = require('../handlers/deliverTxHandlerFactory');
const infoHandlerFactory = require('../handlers/infoHandlerFactory');
const AppState = require('./AppState');

/**
 * JS machine ABCI application
 */
class JsMachineAbciApp {
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
  }

  /**
   * Create handlers for ABCI server
   * @returns {{checkTx: Function, deliverTx: Function, commit: Function, info: Function}}
   */
  createHandlers() {
    const checkTx = checkTxHandlerFactory();
    const commit = commitHandlerFactory();
    const deliverTx = deliverTxHandlerFactory();
    const info = infoHandlerFactory(this.appState);

    return {
      info,
      checkTx,
      deliverTx,
      commit,
    };
  }
}

module.exports = JsMachineAbciApp;
