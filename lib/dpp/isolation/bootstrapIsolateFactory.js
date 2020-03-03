const { Isolate, Reference } = require('isolated-vm');

/**
 * @param {ExternalCopy<ArrayBuffer>} snapshot
 * @param {DataProvider} dataProvider
 * @param {Object} isolateOptions
 * @returns {function():module:isolated-vm.Context}
 */
function bootstrapIsolateFactory(snapshot, dataProvider, isolateOptions) {
  /**
   * @typedef {function} bootstrapIsolateFromSnapshot
   * @param {ExternalCopy<ArrayBuffer>} snapshot
   * @param {DataProvider} dataProvider
   * @returns {Promise<module:isolated-vm.Context>}
   */
  return async function bootstrapIsolateFromSnapshot() {
    const isolate = new Isolate({ ...isolateOptions, snapshot });
    const context = await isolate.createContext();
    const { global: jail } = context;
    await jail.set('global', jail.derefInto());
    await jail.set('dataProviderExternalReference', new Reference(dataProvider));
    await context.eval(`
    // Isolates do not have timers, so we need to add them
    const timeoutFunction = bootstrapTimeoutShim();
    global.setImmediate = timeoutFunction;
    global.setTimeout = timeoutFunction;
    const dataProviderWrapper = bootstrapDataProvider();
    global.dpp = bootstrapDpp(dataProviderWrapper);
  `);
    return context;
  };
}

module.exports = bootstrapIsolateFactory;
