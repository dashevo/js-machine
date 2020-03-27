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

const DashPlatformProtocol = require('@dashevo/dpp');

const { UpdateStatePromiseClient } = require('@dashevo/drive-grpc');

const createIsolatedValidatorSnapshot = require('./dpp/isolation/validator/createIsolatedValidatorSnapshot');
const createIsolatedDppFactory = require('./dpp/isolation/validator/createIsolatedDppFactory');
const unserializeStateTransitionFactory = require(
  './abci/handlers/stateTransition/unserializeStateTransitionFactory',
);

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
 * @param {string} options.TENDERMINT_RPC_HOST
 * @param {string} options.TENDERMINT_RPC_PORT
 * @param {string} options.ISOLATED_ST_UNSERIALIZATION_MEMORY_LIMIT
 * @param {string} options.ISOLATED_ST_UNSERIALIZATION_TIMEOUT_MILLIS
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
    isolatedSTUnserializationMemoryLimit: asValue(
      parseInt(options.ISOLATED_ST_UNSERIALIZATION_MEMORY_LIMIT, 10),
    ),
    isolatedSTUnserializationTimeout: asValue(
      parseInt(options.ISOLATED_ST_UNSERIALIZATION_TIMEOUT_MILLIS, 10),
    ),
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
  const isolatedSnapshot = await createIsolatedValidatorSnapshot();

  container.register({
    isolatedSTUnserializationOptions: asFunction((
      isolatedSTUnserializationMemoryLimit,
      isolatedSTUnserializationTimeout,
    ) => ({
      memoryLimit: isolatedSTUnserializationMemoryLimit,
      timeout: isolatedSTUnserializationTimeout,
    })),

    isolatedJsonSchemaValidatorSnapshot: asValue(isolatedSnapshot),

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

    unserializeStateTransition: asFunction((
      isolatedJsonSchemaValidatorSnapshot,
      isolatedSTUnserializationOptions,
      dataProvider,
    ) => {
      const createIsolatedDpp = createIsolatedDppFactory(
        isolatedJsonSchemaValidatorSnapshot,
        isolatedSTUnserializationOptions,
        dataProvider,
      );

      return unserializeStateTransitionFactory(createIsolatedDpp);
    }),

    transactionalUnserializeStateTransition: asFunction((
      isolatedJsonSchemaValidatorSnapshot,
      isolatedSTUnserializationOptions,
      transactionalDataProvider,
    ) => {
      const createIsolatedDpp = createIsolatedDppFactory(
        isolatedJsonSchemaValidatorSnapshot,
        isolatedSTUnserializationOptions,
        transactionalDataProvider,
      );

      return unserializeStateTransitionFactory(createIsolatedDpp);
    }),

    transactionalDpp: asFunction(transactionalDataProvider => (
      new DashPlatformProtocol({ dataProvider: transactionalDataProvider })
    )),

    noDataProviderDpp: asFunction(() => (
      new DashPlatformProtocol({ dataProvider: undefined })
    )),

    dpp: asFunction(dataProvider => (
      new DashPlatformProtocol({ dataProvider })
    )),
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
    ) => deliverTxHandlerFactory(
      transactionalUnserializeStateTransition,
      transactionalDpp,
      driveUpdateStateClient,
      blockchainState,
      identityRepository,
      blockExecutionDBTransactions,
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
