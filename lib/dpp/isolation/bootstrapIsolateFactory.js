const { Isolate, Reference } = require('isolated-vm');

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitForIdentityRequest(jail, dataProvider) {
  const globalRef = await jail.get('global');
  const requestRef = await globalRef.get('fetchIdentityRequest');

  if (requestRef) {
    const requestVal = await requestRef.copy();
    console.log('received id', requestVal);

    if (requestVal) {
      const response = await dataProvider.fetchIdentity(requestVal);
      if (response) {
        await globalRef.set('fetchIdentityRequest', response.toJSON());
      } else {
        await globalRef.set('fetchIdentityRequest', null);
      }
    }
  }

  await wait(10);
  await waitForIdentityRequest(jail, dataProvider);
}

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
   * @returns {Promise<{context: Context, isolate: Isolate}>}
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
    await jail.set('consoleRef', new Reference(console));

    waitForIdentityRequest(jail, dpp.dataProvider);

    await context.eval(`
      // Some of DPP deps needs browser location
      // so we added it as temprary workaround
      // We need to compile file for NodeJS
      // and do not user bundles for browsers
      global.location = { href: 'shim' };

      // Isolates do not have timers, so we need to add them
      const timeoutFunction = createTimeoutShim();
      global.setImmediate = timeoutFunction;
      global.setTimeout = timeoutFunction;
      const dataProviderWrapper = createDataProvider();
      global.dataProviderWrapper = dataProviderWrapper;
      global.dpp = createDpp(dataProviderWrapper);
      const logRef = consoleRef.getSync('log');
      global.console = {
        log: (...args) => logRef.apply(consoleRef.derefInto(), args, { result: { copy: true } }),
      };
      `);

    return { context, isolate };
  }

  return bootstrapIsolate;
}

module.exports = bootstrapIsolateFactory;
