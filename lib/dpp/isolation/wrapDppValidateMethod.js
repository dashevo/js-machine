const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const AbstractStateTransition = require('@dashevo/dpp/lib/stateTransition/AbstractStateTransition');

const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

function wrapDppValidateMethod(objectPath, methodName, jail, executionOptions) {
  return async function dppValidateMethod(stateTransition, ...args) {
    let stateTransitionJson = stateTransition;

    if (stateTransition instanceof AbstractStateTransition) {
      stateTransitionJson = stateTransition.toJSON();
    }

    const res = await invokeFunctionFromIsolate(
      jail,
      objectPath,
      methodName,
      [stateTransitionJson, ...args],
      executionOptions,
    );
    const validationResult = new ValidationResult();
    return Object.assign(validationResult, res);
  };
}

module.exports = wrapDppValidateMethod;
