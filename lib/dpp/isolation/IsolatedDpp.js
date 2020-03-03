const wrapDppCreateMethod = require('./wrapDppCreateMethod');
const wrapDppValidateMethod = require('./wrapDppValidateMethod');

class IsolatedDpp {
  constructor(context, defaultExecutionOptions, dpp) {
    this.externalDpp = dpp;
    this.defaultExecutionOptions = defaultExecutionOptions;
    const jail = context.gloabl;
    this.jail = jail;

    this.dataContract = {};

    this.document = {};

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
      ),
      createFromSerialized: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromSerialized',
        context,
        defaultExecutionOptions,
        dpp,
      ),
      createFromObject: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromObject',
        jail,
        defaultExecutionOptions,
        dpp,
      ),
    };

    this.identity = {};
  }
}

module.exports = IsolatedDpp;
