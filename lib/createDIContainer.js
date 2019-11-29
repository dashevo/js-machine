const { promisify } = require('util');

const {
  createContainer: createAwilixContainer,
  InjectionMode,
  asClass,
  asFunction,
  asValue,
} = require('awilix');

const level = require('level-rocksdb');

const { client: { http: JaysonClient } } = require('jayson');

const LRUCache = require('lru-cache');

const DashPlatformProtocol = require('@dashevo/dpp');

const { UpdateStatePromiseClient } = require('@dashevo/drive-grpc');

const BlockchainStateLevelDBRepository = require('./state/BlockchainStateLevelDBRepository');

const TendermintRPCClient = require('./api/TendermintRPCClient');

const DataProvider = require('./dpp/DataProvider');

const wrapInErrorHandlerFactory = require('./abci/errors/wrapInErrorHandlerFactory');

const checkTxHandlerFactory = require('./abci/handlers/checkTxHandlerFactory');
const commitHandlerFactory = require('./abci/handlers/commitHandlerFactory');
const deliverTxHandlerFactory = require('./abci/handlers/deliverTxHandlerFactory');
const infoHandlerFactory = require('./abci/handlers/infoHandlerFactory');
const beginBlockHandlerFactory = require('./abci/handlers/beginBlockHandlerFactory');

/**
 *
 * @param {Object} options
 * @param {string} options.ABCI_HOST
 * @param {string} options.ABCI_PORT
 * @param {string} options.DRIVE_UPDATE_STATE_HOST
 * @param {string} options.DRIVE_UPDATE_STATE_PORT
 * @param {string} options.DRIVE_API_HOST
 * @param {string} options.DRIVE_API_PORT
 * @param {string} options.STATE_LEVEL_DB_FILE
 * @param {string} options.DPP_CONTRACT_CACHE_SIZE
 *
 * @return {AwilixContainer}
 */
async function createDIContainer(options) {
  const container = createAwilixContainer({
    injectionMode: InjectionMode.CLASSIC,
  });

  /**
   * Register environment variables
   */
  container.register({
    abciHost: asValue(options.ABCI_HOST),
    abciPort: asValue(options.ABCI_PORT),
    driveUpdateStateHost: asValue(options.DRIVE_UPDATE_STATE_HOST),
    driveUpdateStatePort: asValue(options.DRIVE_UPDATE_STATE_PORT),
    driveApiHost: asValue(options.DRIVE_API_HOST),
    driveApiPort: asValue(options.DRIVE_API_PORT),
    stateLevelDBFile: asValue(options.STATE_LEVEL_DB_FILE),
    dppContractCacheSize: asValue(options.DPP_CONTRACT_CACHE_SIZE),
  });

  /**
   * Register common services
   */
  container.register({
    logger: asValue(console),
  });

  /**
   * Register state
   */
  container.register({
    stateLevelDB: asFunction(stateLevelDBFile => (
      level(stateLevelDBFile, { valueEncoding: 'binary' })
    )).disposer(levelDB => levelDB.close())
      .singleton(),

    blockchainStateRepository: asClass(BlockchainStateLevelDBRepository),
  });

  const blockchainStateRepository = container.resolve('blockchainStateRepository');
  const blockchainState = await blockchainStateRepository.fetch();

  container.register({
    blockchainState: asValue(blockchainState),
  });

  /**
   * Register DPP
   */
  container.register({
    driveApiClient: asFunction((driveApiHost, driveApiPort) => {
      const driveApiClient = new JaysonClient({
        host: driveApiHost,
        port: driveApiPort,
      });

      driveApiClient.request = promisify(driveApiClient.request.bind(driveApiClient));

      return driveApiClient;
    }).singleton(),

    contractCache: asFunction(dppContractCacheSize => (
      new LRUCache(dppContractCacheSize)
    )).singleton(),

    dataProvider: asClass(DataProvider),

    dpp: asClass(DashPlatformProtocol)
      .inject(() => ({ userId: undefined, contract: undefined }))
      .proxy()
      .singleton(),
  });

  /**
   * Register ABCI handlers and dependencies
   */
  container.register({
    driveUpdateStateClient: asFunction((driveUpdateStateHost, driveUpdateStatePort) => (
      new UpdateStatePromiseClient(`${driveUpdateStateHost}:${driveUpdateStatePort}`)
    )).singleton(),

    tendermintRPC: asFunction(() => (
      new TendermintRPCClient()
    )).singleton(),

    infoHandler: asFunction(infoHandlerFactory),
    checkTxHandler: asFunction(checkTxHandlerFactory),
    beginBlockHandler: asFunction(beginBlockHandlerFactory),
    deliverTxHandler: asFunction(deliverTxHandlerFactory),
    commitHandler: asFunction(commitHandlerFactory),

    wrapInErrorHandler: asFunction(wrapInErrorHandlerFactory),

    abciHandlers: asFunction(({
      infoHandler,
      checkTxHandler,
      beginBlockHandler,
      deliverTxHandler,
      commitHandler,
      wrapInErrorHandler,
    }) => ({
      info: infoHandler,
      checkTx: wrapInErrorHandler(checkTxHandler),
      beginBlock: beginBlockHandler,
      deliverTx: wrapInErrorHandler(deliverTxHandler),
      commit: commitHandler,
    })).proxy().singleton(),
  });

  return container;
}

module.exports = createDIContainer;
