const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const AbstractStateTransition = require('@dashevo/dpp/lib/stateTransition/AbstractStateTransition');
const Document = require('@dashevo/dpp/lib/document/Document');
const Identity = require('@dashevo/dpp/lib/identity/Identity');
const DataContract = require('@dashevo/dpp/lib/dataContract/DataContract');

const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

function wrapDppValidateMethod(objectPath, methodName, jail, executionOptions) {
  return async function dppValidateMethod(dppModel, ...args) {
    let dppModelJson = dppModel;

    if (
      dppModel instanceof AbstractStateTransition
      || dppModel instanceof Document
      || dppModel instanceof Identity
      || dppModel instanceof DataContract
    ) {
      dppModelJson = dppModel.toJSON();
    }

    const res = await invokeFunctionFromIsolate(
      jail,
      objectPath,
      methodName,
      [dppModelJson, ...args],
      executionOptions,
    );
    const validationResult = new ValidationResult();
    return Object.assign(validationResult, res);
  };
}

module.exports = wrapDppValidateMethod;
