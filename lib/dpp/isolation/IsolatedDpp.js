const { Isolate, Reference } = require('isolated-vm');

const wrapDppCreateMethod = require('./wrapDppCreateMethod');
const wrapDppValidateMethod = require('./wrapDppValidateMethod');
const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

const DPP_FACADE_NAMES = {
  DATA_CONTRACT: 'dataContract',
  DOCUMENT: 'document',
  STATE_TRANSITION: 'stateTransition',
  IDENTITY: 'identity',
};

/**
 * Create new instance of the VM and return it's context (factory)
 *
 * @param dpp
 * @param snapshot
 * @param isolateOptions
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

class IsolatedDpp {
  /**
   * @param {DashPlatformProtocol} dpp
   * @param {ExternalCopy<ArrayBuffer>} snapshot
   * @param {{ isolateOptions: Object, executionOptions: Object }} options
   */
  constructor(dpp, snapshot, options) {
    this.dpp = dpp;
    this.snapshot = snapshot;
    this.options = options;

    this.bootstrapIsolate = bootstrapIsolateFactory(
      dpp,
      snapshot,
      options.isolateOptions,
    );

    this.initializeDataContractFacade();
    this.initializeDocumentFacade();
    this.initializeIdentityFacade();
    this.initializeStateTransitionFacade();
  }

  /**
   * Init `dpp.dataContract` facade
   */
  initializeDataContractFacade() {
    this.dataContract = {
      create: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.dataContract',
        'create',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.DATA_CONTRACT,
      ),
      createFromObject: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.dataContract',
        'createFromObject',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.DATA_CONTRACT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.dataContract',
        'createFromSerialized',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.DATA_CONTRACT,
      ),
      createStateTransition: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.dataContract',
        'createStateTransition',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.dataContract',
        'validate',
        this.options.executionOptions,
      ),
    };
  }

  /**
   * Init `dpp.document` facade
   */
  initializeDocumentFacade() {
    this.document = {
      create: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.document',
        'create',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.DOCUMENT,
      ),
      createFromObject: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.document',
        'createFromObject',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.DOCUMENT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.document',
        'createFromSerialized',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.DOCUMENT,
      ),
      createStateTransition: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.document',
        'createStateTransition',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.document',
        'validate',
        this.options.executionOptions,
      ),
    };
  }

  /**
   * Init `dpp.identity` facade
   */
  initializeIdentityFacade() {
    this.identity = {
      create: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.identity',
        'create',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.IDENTITY,
      ),
      createFromObject: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.identity',
        'createFromObject',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.IDENTITY,
      ),
      createFromSerialized: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.identity',
        'createFromSerialized',
        this.options.executionOptions,
        this.dpp,
        DPP_FACADE_NAMES.IDENTITY,
      ),
      async applyStateTransition(stateTransition, identity) {
        const { global: jail } = await this.bootstrapIsolate();
        const identityReference = await invokeFunctionFromIsolate(
          jail,
          'dpp.identity',
          'applyStateTransition',
          [stateTransition.toJSON(), identity.toJSON()],
          { ...this.options.executionOptions, ...{ arguments: { copy: true } } },
        );

        const rawIdentity = await identityReference
          .getSync('toJSON')
          .apply(
            identityReference.derefInto(),
            [],
            { ...this.options.executionOptions, ...{ result: { copy: true } } },
          );

        return this.dpp.identity.createFromObject(rawIdentity, { skipValidation: true });
      },
      validate: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.identity',
        'validate',
        this.options.executionOptions,
      ),
    };
  }

  /**
   * Init `dpp.stateTransition` facade
   */
  initializeStateTransitionFacade() {
    this.stateTransition = {
      validateStateTransitionStructure: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'validateStateTransitionStructure',
        this.options.executionOptions,
      ),
      validateStateTransitionData: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'validateStateTransitionData',
        this.options.executionOptions,
      ),
      validateStructure: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'validateStructure',
        this.options.executionOptions,
      ),
      validateData: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'validateData',
        this.options.executionOptions,
      ),
      validate: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'validate',
        this.options.executionOptions,
      ),
      createStateTransition: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'createStateTransition',
        this.options.executionOptions,
        this.dpp,
        'stateTransition',
      ),
      createFromSerialized: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'createFromSerialized',
        this.options.executionOptions,
        this.dpp,
        'stateTransition',
      ),
      createFromObject: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'createFromObject',
        this.options.executionOptions,
        this.dpp,
        'stateTransition',
      ),
    };
  }
}

module.exports = IsolatedDpp;
