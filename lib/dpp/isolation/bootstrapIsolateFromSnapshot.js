const { Isolate, Reference } = require('isolated-vm');

/**
 * @param {ExternalCopy<ArrayBuffer>} snapshot
 * @param {DataProvider} dataProvider
 * @returns {Promise<module:isolated-vm.Context>}
 */
async function bootstrapIsolateFromSnapshot(snapshot, dataProvider) {
  const isolate = new Isolate({ snapshot });
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
}

module.exports = bootstrapIsolateFromSnapshot;
