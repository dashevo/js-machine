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
  constructor(context, defaultExecutionOptions, dpp) {
    const jail = context.global;

    this.dataContract = {
      create: wrapDppCreateMethod(
        'dpp.dataContract',
        'create',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DATA_CONTRACT,
      ),
      createFromObject: wrapDppCreateMethod(
        'dpp.dataContract',
        'createFromObject',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DATA_CONTRACT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        'dpp.dataContract',
        'createFromSerialized',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DATA_CONTRACT,
      ),
      createStateTransition: wrapDppCreateMethod(
        'dpp.dataContract',
        'createStateTransition',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        'dpp.dataContract',
        'validate',
        jail,
        defaultExecutionOptions,
      ),
    };

    this.document = {
      create: wrapDppCreateMethod(
        'dpp.document',
        'create',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DOCUMENT,
      ),
      createFromObject: wrapDppCreateMethod(
        'dpp.document',
        'createFromObject',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DOCUMENT,
      ),
      createFromSerialized: wrapDppCreateMethod(
        'dpp.document',
        'createFromSerialized',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.DOCUMENT,
      ),
      createStateTransition: wrapDppCreateMethod(
        'dpp.document',
        'createStateTransition',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.STATE_TRANSITION,
      ),
      validate: wrapDppValidateMethod(
        'dpp.document',
        'validate',
        jail,
        defaultExecutionOptions,
      ),
    };

    this.identity = {
      create: wrapDppCreateMethod(
        'dpp.identity',
        'create',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.IDENTITY,
      ),
      createFromObject: wrapDppCreateMethod(
        'dpp.identity',
        'createFromObject',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.IDENTITY,
      ),
      createFromSerialized: wrapDppCreateMethod(
        'dpp.identity',
        'createFromSerialized',
        jail,
        defaultExecutionOptions,
        dpp,
        DPP_MODEL_TYPES.IDENTITY,
      ),
      async applyStateTransition(stateTransition, identity) {
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
        'dpp.identity',
        'validate',
        jail,
        defaultExecutionOptions,
      ),
    };

    this.stateTransition = {
      validateStateTransitionStructure: wrapDppValidateMethod(
        'dpp.stateTransition',
        'validateStateTransitionStructure',
        jail,
        defaultExecutionOptions,
      ),
      validateStateTransitionData: wrapDppValidateMethod(
        'dpp.stateTransition',
        'validateStateTransitionData',
        jail,
        defaultExecutionOptions,
      ),
      validateStructure: wrapDppValidateMethod(
        'dpp.stateTransition',
        'validateStructure',
        jail,
        defaultExecutionOptions,
      ),
      validateData: wrapDppValidateMethod(
        'dpp.stateTransition',
        'validateData',
        jail,
        defaultExecutionOptions,
      ),
      validate: wrapDppValidateMethod(
        'dpp.stateTransition',
        'validate',
        jail,
        defaultExecutionOptions,
      ),
      createStateTransition: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createStateTransition',
        jail,
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
      createFromSerialized: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromSerialized',
        jail,
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
      createFromObject: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromObject',
        jail,
        defaultExecutionOptions,
        dpp,
        'stateTransition',
      ),
    };
  }
}

module.exports = IsolatedDpp;
