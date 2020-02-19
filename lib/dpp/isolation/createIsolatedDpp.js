const {
  ExternalCopy, Reference, Isolate,
} = require('isolated-vm');

const DashPlatformProtocol = require('@dashevo/dpp');

const wrapDppCreateMethod = require('./wrapDppCreateMethod');
const compileFile = require('./compileFileWithBrowserify');
const invokeFunctionFromReference = require('./invokeFunctionFromReference');

const timeoutInMillis = 1000;
const memoryLimit = 128;

const defaultExecutionOptions = {
  timeout: timeoutInMillis,
  arguments: {
    copy: true,
  },
  result: {
    promise: true,
  },
};

/**
 * Creates a reference to a given data provider to use in dpp
 * @param {DataProvider} dataProvider
 * @param {Context} context
 * @returns {Promise<void>}
 */
async function createDataProviderReference(dataProvider, context) {
  if (!dataProvider) {
    throw new Error('dataProvider is not present');
  }
  const dataProviderMethodNames = Object.keys(dataProvider);

  await context.global.set('dataProvider', new Reference(dataProvider));
  await context.global.set('dataProviderMethods', new ExternalCopy(dataProviderMethodNames).copyInto());
}

/**
 * Compiles dpp and adds it to the context
 * @param {Context} context - context to add dpp
 * @param {DataProvider} dataProvider - data provider to use in the dpp.
 * @returns {Promise<void>}
 */
async function createDppInContext(context, dataProvider) {
  const dppCode = await compileFile('./bootstrapDpp', 'dpp');

  await createDataProviderReference(dataProvider, context);

  await context.eval(dppCode);
}

/**
 * Creates an instance of dpp that will run in it's own virtual machine
 * Please note that to parse serialized entities you need to pass a string instead of buffer,
 * since isolates copies buffers as UInt8Array, and the current version of
 * dpp can work only with buffers.
 * Also, it will always return raw objects instead of instances
 * @param {DataProvider} dataProvider
 * @returns {Promise<{stateTransition: {createFromSerialized(string, object): Promise<Object>}}>}
 */
async function createIsolatedDpp(dataProvider) {
  // Set up isolate
  const isolate = new Isolate({
    memoryLimit,
  });
  const context = await isolate.createContext();
  const { global: jail } = context;
  await jail.set('global', jail.derefInto());

  // This adds this function to the context, so we can use it to make calls to DataProvider
  await context.eval(`${invokeFunctionFromReference}`);
  // This will instantiate 'dpp' into the isolate
  await createDppInContext(context, dataProvider);

  const dpp = new DashPlatformProtocol(dataProvider);

  return {
    stateTransition: {
      createFromSerialized: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromSerialized',
        jail,
        defaultExecutionOptions,
        dpp,
      ),
      createFromObject: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromObject',
        jail,
        defaultExecutionOptions,
        dpp,
      ),
    },
  };
}

module.exports = createIsolatedDpp;
