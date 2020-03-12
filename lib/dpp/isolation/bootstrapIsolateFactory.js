const { Isolate, Reference } = require('isolated-vm');

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitForIdentityRequest(jail, dataProvider) {
  console.log('before');
  const requestRef = await jail.get('fetchIdentityRequest');
  console.log('after');

  console.log('ref', requestRef);
  if (requestRef) {
    const requestVal = requestRef;
    await jail.set('fetchIdentityRequest', null);

    if (typeof requestVal === 'string') {
      console.log('received id', requestVal);
      const response = await dataProvider.fetchIdentity(requestVal);
      if (response) {
        console.log('res', response);
        await jail.set('fetchIdentityResponse', response.toJSON(), { copy: true });
      } else {
        console.log('Pixda');
        await jail.set('fetchIdentityResponse', null);
      }
    }
  }

  await wait(1);
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
  let cachedData;
  let produceCachedData = true;

  async function bootstrapIsolate() {
    //console.log(snapshot.copy().byteLength / 1024 / 1024, 'mb');
    //console.time('a');
    const isolate = new Isolate({
      ...isolateOptions,
      snapshot,
    });
    //console.timeEnd('a');

    const context = await isolate.createContext();
    const { global: jail } = context;

    await context.eval('dpp = createDpp({});');

    // The code below needs to run after every isolate bootstrap from snapshot,
    // as snapshots can't hold the references. Check more on the issue here:
    // https://github.com/laverdet/isolated-vm/issues/26#issuecomment-496359614

    await jail.set('global', jail.derefInto());
    await jail.set('dataProviderExternalReference', new Reference(dpp.dataProvider));
    await jail.set('consoleReference', new Reference(console));

    // waitForIdentityRequest(jail, dpp.dataProvider);

    if (cachedData) {
      console.log('Using cache');
    }

    const res = await context.eval(`
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
      // dpp = createDpp({});
      global.dpp = createDpp(dataProviderWrapper);
      global.fetchIdentityRequest = null;
      global.fetchIdentityResponse = null;
      global.invokeResult = null;
      const logRef = consoleReference.getSync('log');
      const timeRef = consoleReference.getSync('time');
      const timeEndRef = consoleReference.getSync('timeEnd');
      global.console = {
        log: (...args) => logRef.apply(consoleReference.derefInto(), args, { arguments: { copy: true }, result: { copy: true }}),
        time: (...args) => timeRef.apply(consoleReference.derefInto(), args, { result: { copy: true }}),
        timeEnd: (...args) => timeEndRef.apply(consoleReference.derefInto(), args, { result: { copy: true }}),
      };

      console.time('start');
      const rawStateTransition = {
        protocolVersion: 0,
        type: 3,
        signature: 'H1kOzA+sRuy/dtvYZsdUZ793GuxH2JAwvsbg16m37DodULJLZ7Y/hzPhBCvIxjLiZRwwXcf94aIgZglrm7i6Eo0=',
        signaturePublicKeyId: 1,
        identityType: 1,
        lockedOutPoint: 'A+sRuy/dtvYZsdUZ793GuxH2JAwvsbg16m37DodULJLZ7Y/h',
        publicKeys: [
          {
            id: 1,
            type: 1,
            data: 'A6zlANVwDKO2/qu6hpAsgBR/qpPc/GCkvsIzyt7IurgM',
            isEnabled: true
          }
        ]
      };

      console.log('Warming up');
      dpp.stateTransition.validateData(rawStateTransition)
        .then((res) => { console.log('warmed'); console.timeEnd('start'); })
        .catch((e) => { console.log('warmed up'); });
      `, {
      //produceCachedData,
      //cachedData,
    });

    // console.log(res);
    //
    // if (res.cachedData) {
    //   console.log('cache produced');
    //   cachedData = res.cachedData;
    // }
    //
    // if (res.cachedDataRejected) {
    //   throw new Error('Cache rejected');
    // }
    //
    // await context.evalClosure(`
    //   global.next = async function() {
    //     await $0.apply(null, [], { result: { promise: true } });
    //   }
    // `, [function () {
    //   return new Promise(resolve => setImmediate(resolve));
    // }], { arguments: { reference: true } });

    return { context, isolate, cachedData };
  }

  return bootstrapIsolate;
}

module.exports = bootstrapIsolateFactory;
