const bootstrapIsolateFactory = require('./bootstrapIsolateFactory');
const wrapDppCreateMethod = require('./wrapDppCreateMethod');
const wrapDppValidateMethod = require('./wrapDppValidateMethod');
const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

const DPP_FACADE_NAMES = {
  DATA_CONTRACT: 'dataContract',
  DOCUMENT: 'document',
  STATE_TRANSITION: 'stateTransition',
  IDENTITY: 'identity',
};

class IsolatedDpp {
  /**
   *
   * @param defaultExecutionOptions
   * @param dpp
   * @param snapshot
   * @param dataProvider
   * @param isolateOptions
   * @returns {DashPlatformProtocol}
   */
  constructor(defaultExecutionOptions, dpp, snapshot, dataProvider, isolateOptions) {
    const bootstrapIsolate = bootstrapIsolateFactory(snapshot, dataProvider, isolateOptions);

    this.dataContract = {
      create: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.dataContract',
        'create',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.DATA_CONTRACT,
      ),
      createFromObject: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.dataContract',
        'createFromObject',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.DATA_CONTRACT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.dataContract',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.DATA_CONTRACT,
      ),
      createStateTransition: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.dataContract',
        'createStateTransition',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.dataContract',
        'validate',
        defaultExecutionOptions,
      ),
    };

    this.document = {
      create: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.document',
        'create',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.DOCUMENT,
      ),
      createFromObject: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.document',
        'createFromObject',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.DOCUMENT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.document',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.DOCUMENT,
      ),
      createStateTransition: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.document',
        'createStateTransition',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.document',
        'validate',
        defaultExecutionOptions,
      ),
    };

    this.identity = {
      create: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.identity',
        'create',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.IDENTITY,
      ),
      createFromObject: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.identity',
        'createFromObject',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.IDENTITY,
      ),
      createFromSerialized: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.identity',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        DPP_FACADE_NAMES.IDENTITY,
      ),
      async applyStateTransition(stateTransition, identity) {
        const { global: jail } = await bootstrapIsolate();
        const identityReference = await invokeFunctionFromIsolate(
          jail,
          'dpp.identity',
          'applyStateTransition',
          [stateTransition.toJSON(), identity.toJSON()],
          { ...defaultExecutionOptions, ...{ arguments: { copy: true } } },
        );

        const rawIdentity = await identityReference
          .getSync('toJSON')
          .apply(
            identityReference.derefInto(),
            [],
            { ...defaultExecutionOptions, ...{ result: { copy: true } } },
          );

        return dpp.identity.create(rawIdentity);
      },
      validate: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.identity',
        'validate',
        defaultExecutionOptions,
      ),
    };

    this.stateTransition = {
      validateStateTransitionStructure: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'validateStateTransitionStructure',
        defaultExecutionOptions,
      ),
      validateStateTransitionData: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'validateStateTransitionData',
        defaultExecutionOptions,
      ),
      validateStructure: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'validateStructure',
        defaultExecutionOptions,
      ),
      validateData: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'validateData',
        defaultExecutionOptions,
      ),
      validate: wrapDppValidateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'validate',
        defaultExecutionOptions,
      ),
      createStateTransition: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'createStateTransition',
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
      createFromSerialized: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
      createFromObject: wrapDppCreateMethod(
        bootstrapIsolate,
        'dpp.stateTransition',
        'createFromObject',
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
    };
  }
}

module.exports = IsolatedDpp;
