const { Isolate, Reference } = require('isolated-vm');
const DashPlatformProtocol = require('@dashevo/dpp');

const IsolatedDpp = require('./IsolatedDpp');
const createDppInContext = require('./createDppInContext');

const defaultMemoryLimit = 128;

const defaultExecutionOptions = {
  timeout: 1000,
  arguments: {
    copy: true,
  },
  result: {
    promise: true,
  },
};

/**
 * Creates an instance of dpp that will run in it's own virtual machine
 * Please note that to parse serialized entities you need to pass a string instead of buffer,
 * since isolates copies buffers as UInt8Array, and the current version of
 * dpp can work only with buffers.
 * Also, it will always return raw objects instead of instances
 * @param {DataProvider} dataProvider
 * @param {number} memoryLimit - memory limit for this isolate in megabytes
 * @param {number} timeout - maximum time to allow script execution in the isolate
 * @returns {Promise<{stateTransition: {createFromSerialized(string, object): Promise<Object>}}>}
 */
async function createIsolatedDpp(dataProvider, memoryLimit, timeout) {
  const executionOptions = { ...defaultExecutionOptions, timeout };
  // Set up isolate
  const isolate = new Isolate({
    memoryLimit: memoryLimit || defaultMemoryLimit,
  });
  const context = await isolate.createContext();
  const { global: jail } = context;
  await jail.set('global', jail.derefInto());

  // Set log function
  await jail.set('logReference', new Reference(console.log));
  await context.eval('global.log = function log(...args) { logReference.apply(null, args, { arguments: {copy: true} }) }');

  // This will instantiate 'dpp' into the isolate
  await createDppInContext(context, dataProvider);

  const dpp = new DashPlatformProtocol({ dataProvider });

  return new IsolatedDpp(context, executionOptions, dpp);
}

module.exports = createIsolatedDpp;
