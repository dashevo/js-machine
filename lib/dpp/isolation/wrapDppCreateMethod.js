const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

const dppErrors = [];

/**
 * Wraps dpp create method.
 * @param {string} objectPath - path to a object in a global namespace withing the isolate,
 * i.e. dpp.stateTransition
 * @param {string} methodName - method name of the above object to call. For example, 'create'
 * @param {Reference} jail - global object of the isolate's context
 * @param {Object} executionOptions - isolated-vm execution options
 * @param {DashPlatformProtocol} dpp - external dpp
 * to create models from jsons
 * @param {string} modelType -
 * can be 'document', 'stateTransition', 'identity', 'dataContract'
 * @returns {dppCreateMethod}
 */
function wrapDppCreateMethod(objectPath, methodName, jail, executionOptions, dpp, modelType) {
  /**
   * Invokes create method from dpp and returns an instance of corresponding dpp model
   * @typedef dppCreateMethod
   * return {StateTransition|Document|Identity|DataContract}
   */
  return async function dppCreateMethod(...args) {
    const dppModelReference = await invokeFunctionFromIsolate(
      jail,
      objectPath,
      methodName,
      args,
      executionOptions,
    );

    const rawDppJson = await dppModelReference
      .getSync('toJSON')
      .apply(
        dppModelReference.derefInto(),
        [],
        { ...executionOptions, ...{ result: { copy: true } } },
      );

    try {
      return dpp[modelType].create(rawDppJson);
    } catch (e) {
      if (dppErrors.includes(e.name)) {
        // TODO: error handling
      }
      throw e;
    }
  };
}

module.exports = wrapDppCreateMethod;
