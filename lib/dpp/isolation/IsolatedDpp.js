const bootstrapIsolate = require('./bootstrapIsolateFromSnapshot');
const wrapDppCreateMethod = require('./wrapDppCreateMethod');
const wrapDppValidateMethod = require('./wrapDppValidateMethod');
const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

const DPP_MODEL_TYPES = {
  DATA_CONTRACT: 'dataContract',
  DOCUMENT: 'document',
  STATE_TRANSITION: 'stateTransition',
  IDENTITY: 'identity',
};

class IsolatedDpp {
  constructor(defaultExecutionOptions, dpp, snapshot, dataProvider) {

    this.dataContract = {
      create: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.dataContract',
        'create',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DATA_CONTRACT,
      ),
      createFromObject: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.dataContract',
        'createFromObject',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DATA_CONTRACT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.dataContract',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DATA_CONTRACT,
      ),
      createStateTransition: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.dataContract',
        'createStateTransition',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        snapshot,
        dataProvider,
        'dpp.dataContract',
        'validate',
        defaultExecutionOptions,
      ),
    };

    this.document = {
      create: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.document',
        'create',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DOCUMENT,
      ),
      createFromObject: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.document',
        'createFromObject',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DOCUMENT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.document',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DOCUMENT,
      ),
      createStateTransition: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.document',
        'createStateTransition',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        snapshot,
        dataProvider,
        'dpp.document',
        'validate',
        defaultExecutionOptions,
      ),
    };

    this.identity = {
      create: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.identity',
        'create',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.IDENTITY,
      ),
      createFromObject: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.identity',
        'createFromObject',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.IDENTITY,
      ),
      createFromSerialized: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.identity',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.IDENTITY,
      ),
      async applyStateTransition(stateTransition, identity) {
        const { global: jail } = await bootstrapIsolate(snapshot, dataProvider);
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
        snapshot,
        dataProvider,
        'dpp.identity',
        'validate',
        defaultExecutionOptions,
      ),
    };

    this.stateTransition = {
      validateStateTransitionStructure: wrapDppValidateMethod(
        snapshot,
        dataProvider,
        'dpp.stateTransition',
        'validateStateTransitionStructure',
        defaultExecutionOptions,
      ),
      validateStateTransitionData: wrapDppValidateMethod(
        snapshot,
        dataProvider,
        'dpp.stateTransition',
        'validateStateTransitionData',
        defaultExecutionOptions,
      ),
      validateStructure: wrapDppValidateMethod(
        snapshot,
        dataProvider,
        'dpp.stateTransition',
        'validateStructure',
        defaultExecutionOptions,
      ),
      validateData: wrapDppValidateMethod(
        snapshot,
        dataProvider,
        'dpp.stateTransition',
        'validateData',
        defaultExecutionOptions,
      ),
      validate: wrapDppValidateMethod(
        snapshot,
        dataProvider,
        'dpp.stateTransition',
        'validate',
        defaultExecutionOptions,
      ),
      createStateTransition: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.stateTransition',
        'createStateTransition',
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
      createFromSerialized: wrapDppCreateMethod(
        snapshot,
        dataProvider,
        'dpp.stateTransition',
        'createFromSerialized',
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
      createFromObject: wrapDppCreateMethod(
        snapshot,
        dataProvider,
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
