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

const MachineDataProvider = require('./dpp/MachineDataProvider');

const wrapInErrorHandlerFactory = require('./abci/errors/wrapInErrorHandlerFactory');

const checkTxHandlerFactory = require('./abci/handlers/checkTxHandlerFactory');
const commitHandlerFactory = require('./abci/handlers/commitHandlerFactory');
const deliverTxHandlerFactory = require('./abci/handlers/deliverTxHandlerFactory');
const infoHandlerFactory = require('./abci/handlers/infoHandlerFactory');
const beginBlockHandlerFactory = require('./abci/handlers/beginBlockHandlerFactory');
const queryHandlerFactory = require('./abci/handlers/queryHandlerFactory');

const IdentityLevelDBRepository = require('./identity/IdentityLevelDBRepository');

const BlockExecutionDBTransactions = require('./abci/BlockExecutionDBTransactions');

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
 * @param {string} options.IDENTITY_LEVEL_DB_FILE
 * @param {string} options.TENDERMINT_HOST
 * @param {string} options.TENDERMINT_RPC_PORT
 * @param {string} options.RATE_LIMITER_ACTIVE
 * @param {string} options.RATE_LIMITER_MAX_TRANSITIONS_PER_ID
 * @param {string} options.RATE_LIMITER_PER_BLOCK_INTERVAL
 * @param {string} options.RATE_LIMITER_INTERVAL_PREFIX
 * @param {string} options.RATE_LIMITER_BAN_PREFIX
 * @param {string} options.RATE_LIMITER_PER_BAN_INTERVAL
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
    identityLevelDBFile: asValue(options.IDENTITY_LEVEL_DB_FILE),
    tendermintHost: asValue(options.TENDERMINT_HOST),
    tendermintPort: asValue(options.TENDERMINT_RPC_PORT),
    rateLimiterActive: asValue((options.RATE_LIMITER_ACTIVE === 'true')),
    rateLimiterMax: asValue(parseInt(options.RATE_LIMITER_MAX_TRANSITIONS_PER_ID, 10)),
    rateLimiterInterval: asValue(parseInt(options.RATE_LIMITER_PER_BLOCK_INTERVAL, 10)),
    rateLimiterPrefix: asValue(options.RATE_LIMITER_INTERVAL_PREFIX),
    rateLimiterBanPrefix: asValue(options.RATE_LIMITER_BAN_PREFIX),
    rateLimiterBanInterval: asValue(parseInt(options.RATE_LIMITER_PER_BAN_INTERVAL, 10)),
  });

  /**
   * Register common services
   */
  container.register({
    logger: asValue(console),
    blockExecutionDBTransactions: asClass(BlockExecutionDBTransactions).singleton(),
  });

  /**
   * Register blockchain state
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

    dataProvider: asClass(MachineDataProvider),

    dpp: asClass(DashPlatformProtocol).proxy(),
  });

  /*
    Register identity
   */
  container.register({
    identityLevelDB: asFunction(identityLevelDBFile => (
      level(identityLevelDBFile, { valueEncoding: 'binary' })
    )).disposer(levelDB => levelDB.close())
      .singleton(),

    identityDpp: asClass(DashPlatformProtocol)
      .inject(() => ({ dataProvider: undefined }))
      .proxy(),

    identityRepository: asClass(IdentityLevelDBRepository),
  });

  /**
   * Register ABCI handlers and dependencies
   */
  container.register({
    driveUpdateStateClient: asFunction((driveUpdateStateHost, driveUpdateStatePort) => (
      new UpdateStatePromiseClient(`${driveUpdateStateHost}:${driveUpdateStatePort}`)
    )).singleton(),

    infoHandler: asFunction(infoHandlerFactory),
    checkTxHandler: asFunction(checkTxHandlerFactory)
      .inject(() => ({
        tendermintRPC: asFunction((tendermintHost, tendermintPort) => (
          new TendermintRPCClient(tendermintHost, tendermintPort)
        )).singleton(),
        rateLimiterActive: (options.RATE_LIMITER_ACTIVE === 'true'),
        rateLimiterMax: parseInt(options.RATE_LIMITER_MAX_TRANSITIONS_PER_ID, 10),
        rateLimiterInterval: parseInt(options.RATE_LIMITER_PER_BLOCK_INTERVAL, 10),
        rateLimiterPrefix: options.RATE_LIMITER_INTERVAL_PREFIX,
        rateLimiterBanPrefix: options.RATE_LIMITER_BAN_PREFIX,
        rateLimiterBanInterval: parseInt(options.RATE_LIMITER_PER_BAN_INTERVAL, 10),
      }))
      .proxy(),
    beginBlockHandler: asFunction(beginBlockHandlerFactory),
    deliverTxHandler: asFunction(deliverTxHandlerFactory)
      .inject(() => ({
        tendermintRPC: asFunction((tendermintHost, tendermintPort) => (
          new TendermintRPCClient(tendermintHost, tendermintPort)
        )).singleton(),
        rateLimiterActive: (options.RATE_LIMITER_ACTIVE === 'true'),
        rateLimiterMax: parseInt(options.RATE_LIMITER_MAX_TRANSITIONS_PER_ID, 10),
        rateLimiterInterval: parseInt(options.RATE_LIMITER_PER_BLOCK_INTERVAL, 10),
        rateLimiterPrefix: options.RATE_LIMITER_INTERVAL_PREFIX,
        rateLimiterBanPrefix: options.RATE_LIMITER_BAN_PREFIX,
        rateLimiterBanInterval: parseInt(options.RATE_LIMITER_PER_BAN_INTERVAL, 10),
      }))
      .proxy(),
    commitHandler: asFunction(commitHandlerFactory),
    queryHandler: asFunction(queryHandlerFactory),

    wrapInErrorHandler: asFunction(wrapInErrorHandlerFactory),

    abciHandlers: asFunction(({
      infoHandler,
      checkTxHandler,
      beginBlockHandler,
      deliverTxHandler,
      commitHandler,
      wrapInErrorHandler,
      queryHandler,
    }) => ({
      info: infoHandler,
      checkTx: wrapInErrorHandler(checkTxHandler),
      beginBlock: beginBlockHandler,
      deliverTx: wrapInErrorHandler(deliverTxHandler),
      commit: commitHandler,
      query: wrapInErrorHandler(queryHandler),
    })).proxy().singleton(),
  });

  return container;
}

module.exports = createDIContainer;
