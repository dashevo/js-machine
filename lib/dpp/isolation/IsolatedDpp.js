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
    };

    this.identity = {};
  }
}

module.exports = IsolatedDpp;
