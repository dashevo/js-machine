const { promisify } = require('util');

const {
  createContainer: createAwilixContainer,
  InjectionMode,
  asClass,
  asFunction,
  asValue,
} = require('awilix');

const level = require('level-rocksdb');

const { client: { http: JaysonClient } } = require('jayson/promise');

const LRUCache = require('lru-cache');

const { Isolate } = require('isolated-vm');

const DashPlatformProtocol = require('@dashevo/dpp');

const { UpdateStatePromiseClient } = require('@dashevo/drive-grpc');

const BlockchainStateLevelDBRepository = require('./state/BlockchainStateLevelDBRepository');

const MachineDataProvider = require('./dpp/MachineDataProvider');
const TransactionalMachineDataProvider = require('./dpp/TransactionalMachineDataProvider');

const wrapInErrorHandlerFactory = require('./abci/errors/wrapInErrorHandlerFactory');

const checkTxHandlerFactory = require('./abci/handlers/checkTxHandlerFactory');
const commitHandlerFactory = require('./abci/handlers/commitHandlerFactory');
const deliverTxHandlerFactory = require('./abci/handlers/deliverTxHandlerFactory');
const infoHandlerFactory = require('./abci/handlers/infoHandlerFactory');
const beginBlockHandlerFactory = require('./abci/handlers/beginBlockHandlerFactory');
const queryHandlerFactory = require('./abci/handlers/queryHandlerFactory');

const unserializeStateTransitionFactory = require(
  './abci/handlers/stateTransition/unserializeStateTransitionFactory',
);

const IdentityLevelDBRepository = require('./identity/IdentityLevelDBRepository');

const BlockExecutionDBTransactions = require('./abci/BlockExecutionDBTransactions');

const RateLimiter = require('./services/RateLimiter');
const fetchTransitionCountByEventFactory = require(
  './tendermint/fetchTransitionCountByEventFactory',
);

const compileFileWithBrowserify = require('./dpp/isolation/dpp/compileFileWithBrowserify');
const IsolatedDpp = require('./dpp/isolation/dpp/IsolatedDpp');

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
 * @param {string} options.TENDERMINT_RPC_HOST
 * @param {string} options.TENDERMINT_RPC_PORT
 * @param {string} options.RATE_LIMITER_ACTIVE
 * @param {string} options.RATE_LIMITER_MAX_TRANSITIONS_PER_ID
 * @param {string} options.RATE_LIMITER_PER_BLOCK_INTERVAL
 * @param {string} options.RATE_LIMITER_INTERVAL_PREFIX
 * @param {string} options.RATE_LIMITER_BAN_PREFIX
 * @param {string} options.RATE_LIMITER_PER_BAN_INTERVAL
 * @param {string} options.ST_EXECUTION_MEMORY_LIMIT
 * @param {string} options.ST_EXECUTION_TIMEOUT_MILLIS
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
    tendermintRpcHost: asValue(options.TENDERMINT_RPC_HOST),
    tendermintRpcPort: asValue(options.TENDERMINT_RPC_PORT),
    rateLimiterActive: asValue((options.RATE_LIMITER_ACTIVE === 'true')),
    rateLimiterMax: asValue(parseInt(options.RATE_LIMITER_MAX_TRANSITIONS_PER_ID, 10)),
    rateLimiterInterval: asValue(parseInt(options.RATE_LIMITER_PER_BLOCK_INTERVAL, 10)),
    rateLimiterPrefix: asValue(options.RATE_LIMITER_INTERVAL_PREFIX),
    rateLimiterBanPrefix: asValue(options.RATE_LIMITER_BAN_PREFIX),
    rateLimiterBanInterval: asValue(parseInt(options.RATE_LIMITER_PER_BAN_INTERVAL, 10)),
    isolationMemoryLimit: asValue(parseInt(options.ST_EXECUTION_MEMORY_LIMIT, 10)),
    isolationTimeout: asValue(parseInt(options.ST_EXECUTION_TIMEOUT_MILLIS, 10)),
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
   * DPP Isolation
   */
  const isolateDataProviderCode = await compileFileWithBrowserify(
    './internal/createDataProviderWrapper', 'createDataProvider',
  );
  const isolateDppCode = await compileFileWithBrowserify(
    './internal/createDpp', 'createDpp',
  );
  const isolateTimeoutShimCode = await compileFileWithBrowserify(
    './internal/createTimeoutShim', 'createTimeoutShim',
  );

  const isolateSnapshot = await Isolate.createSnapshot([
    { code: isolateDataProviderCode },
    { code: isolateDppCode },
    { code: isolateTimeoutShimCode },
  ]);

  container.register({
    isolationOptions: asFunction((isolationMemoryLimit, isolationTimeout) => ({
      isolateOptions: {
        memoryLimit: isolationMemoryLimit,
      },
      executionOptions: {
        arguments: {
          copy: true,
        },
        result: {
          promise: true,
        },
        timeout: isolationTimeout,
      },
    })),
    isolationSnapshot: asValue(isolateSnapshot),
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
    transactionalDataProvider: asClass(TransactionalMachineDataProvider),

    unserializeStateTransition: asFunction(isolatedDpp => (
      unserializeStateTransitionFactory(isolatedDpp)
    )),
    transactionalUnserializeStateTransition: asFunction(transactionalIsolatedDpp => (
      unserializeStateTransitionFactory(transactionalIsolatedDpp)
    )),

    isolatedDpp: asFunction((dpp, isolationSnapshot, isolationOptions) => (
      new IsolatedDpp(dpp, isolationSnapshot, isolationOptions)
    )),
    transactionalIsolatedDpp: asFunction((
      transactionalDpp, isolationSnapshot, isolationOptions,
    ) => (
      new IsolatedDpp(transactionalDpp, isolationSnapshot, isolationOptions)
    )),

    transactionalDpp: asFunction(transactionalDataProvider => (
      new DashPlatformProtocol({ dataProvider: transactionalDataProvider })
    )),
    noDataProviderDpp: asFunction(() => (
      new DashPlatformProtocol({ dataProvider: undefined })
    )),
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

    identityRepository: asClass(IdentityLevelDBRepository),
  });

  /**
   * Register rate limiter
   */
  container.register({
    tendermintRPC: asFunction((tendermintRpcHost, tendermintRpcPort) => (
      new JaysonClient({
        host: tendermintRpcHost,
        port: tendermintRpcPort,
      })
    )).singleton(),

    fetchTransitionCountByEvent: asFunction(
      fetchTransitionCountByEventFactory,
    ),

    rateLimiter: asFunction((
      fetchTransitionCountByEvent,
      rateLimiterInterval,
      rateLimiterMax,
      rateLimiterPrefix,
      rateLimiterBanPrefix,
      rateLimiterBanInterval,
    ) => (
      new RateLimiter(fetchTransitionCountByEvent, {
        rateLimiterInterval,
        rateLimiterMax,
        rateLimiterPrefix,
        rateLimiterBanPrefix,
        rateLimiterBanInterval,
      })
    )),
  });

  /**
   * Register ABCI handlers and dependencies
   */
  container.register({
    driveUpdateStateClient: asFunction((driveUpdateStateHost, driveUpdateStatePort) => (
      new UpdateStatePromiseClient(`${driveUpdateStateHost}:${driveUpdateStatePort}`)
    )).singleton(),

    infoHandler: asFunction(infoHandlerFactory),
    checkTxHandler: asFunction(checkTxHandlerFactory),
    beginBlockHandler: asFunction(beginBlockHandlerFactory),
    deliverTxHandler: asFunction((
      transactionalUnserializeStateTransition,
      transactionalDpp,
      driveUpdateStateClient,
      // eslint-disable-next-line no-shadow
      blockchainState,
      identityRepository,
      blockExecutionDBTransactions,
      rateLimiter,
      rateLimiterActive,
    ) => deliverTxHandlerFactory(
      transactionalUnserializeStateTransition,
      transactionalDpp,
      driveUpdateStateClient,
      blockchainState,
      identityRepository,
      blockExecutionDBTransactions,
      rateLimiter,
      rateLimiterActive,
    )),
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
