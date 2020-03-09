const { Isolate, Reference } = require('isolated-vm');
/**
 * Create new instance of the VM and return it's context (factory)
 *
 * @param {DashPlatformProtocol} dpp
 * @param {ExternalCopy<ArrayBuffer>} snapshot
 * @param {Object} isolateOptions
 *
 * @returns {bootstrapIsolate}
 */
function bootstrapIsolateFactory(dpp, snapshot, isolateOptions) {
  /**
   * Create new instance of the VM and return it's context
   * @typedef bootstrapIsolate
   * @returns {Promise<Context>}
   */
  async function bootstrapIsolate() {
    const isolate = new Isolate({
      ...isolateOptions,
      snapshot,
    });

    const context = await isolate.createContext();
    const { global: jail } = context;

    // The code below needs to run after every isolate bootstrap from snapshot,
    // as snapshots can't hold the references. Check more on the issue here:
    // https://github.com/laverdet/isolated-vm/issues/26#issuecomment-496359614

    await jail.set('global', jail.derefInto());
    await jail.set('dataProviderExternalReference', new Reference(dpp.dataProvider));

    await context.eval(`
      // Isolates do not have timers, so we need to add them
      global.location = { href: 'shim' };
      const timeoutFunction = createTimeoutShim();
      global.setImmediate = timeoutFunction;
      global.setTimeout = timeoutFunction;
      const dataProviderWrapper = createDataProvider();
      global.dpp = createDpp(dataProviderWrapper);
      `);

    return context;
  }

  return bootstrapIsolate;
}

module.exports = bootstrapIsolateFactory;
