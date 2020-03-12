const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const AbstractStateTransition = require('@dashevo/dpp/lib/stateTransition/AbstractStateTransition');
const Document = require('@dashevo/dpp/lib/document/Document');
const Identity = require('@dashevo/dpp/lib/identity/Identity');
const DataContract = require('@dashevo/dpp/lib/dataContract/DataContract');

const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

/**
 * Wrap validation methods of the DPP
 *
 * @param {function():module:isolated-vm.Context} bootstrapIsolate
 * @param {string} objectPath
 * @param {string} methodName
 * @param {Object} executionOptions
 * @returns {dppValidateMethod}
 */
function wrapDppValidateMethod(bootstrapIsolate, objectPath, methodName, executionOptions) {
  /**
   * Wrap validation methods of the DPP
   *
   * @typedef dppValidateMethod
   * @param {
   *   DataContract|Document|AbstractStateTransition|identity|
   *   RawDataContract|RawDocument|RawDocumentsStateTransition|
   *   RawDataContractStateTransition|RawIdentity
   * } dppModel
   * @param {[*]} args
   *
   * @returns {Promise<ValidationResult>}
   */
  async function dppValidateMethod(dppModel, ...args) {
    const { context, isolate } = await bootstrapIsolate();

    let rawModel = dppModel;

    if (
      dppModel instanceof AbstractStateTransition
      || dppModel instanceof Document
      || dppModel instanceof Identity
      || dppModel instanceof DataContract
    ) {
      rawModel = dppModel.toJSON();
    }

    const res = await invokeFunctionFromIsolate(
      context,
      objectPath,
      methodName,
      [rawModel, ...args],
      executionOptions,
    );

    const validationResult = new ValidationResult();
    const resultCopy = await res.copy();

    isolate.dispose();

    return Object.assign(validationResult, resultCopy);
  }

  return dppValidateMethod;
}

module.exports = wrapDppValidateMethod;
