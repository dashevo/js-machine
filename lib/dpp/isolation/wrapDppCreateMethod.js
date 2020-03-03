const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

const dppErrors = [];

/**
 * Wraps dpp create method.
 * @param {function():module:isolated-vm.Context} bootstrapIsolate -
 * function to bootstrap an isolate
 * @param {string} objectPath - path to a object in a global namespace withing the isolate,
 * i.e. dpp.stateTransition
 * @param {string} methodName - method name of the above object to call. For example, 'create'
 * @param {Object} executionOptions - isolated-vm execution options
 * @param {DashPlatformProtocol} dpp - external dpp
 * to create models from jsons
 * @param {string} modelType -
 * can be 'document', 'stateTransition', 'identity', 'dataContract'
 * @returns {dppCreateMethod}
 */
function wrapDppCreateMethod(
  bootstrapIsolate, objectPath, methodName, executionOptions, dpp, modelType,
) {
  /**
   * Invokes create method from dpp and returns an instance of corresponding dpp model
   * @typedef dppCreateMethod
   * return {StateTransition|Document|Identity|DataContract}
   */
  return async function dppCreateMethod(...args) {
    const { global: jail } = await bootstrapIsolate();

    let serialized;
    // Isolates can't work with buffers, so we need to convert it to a string.
    // args[0] is a serialized object.
    if (args[0] instanceof Buffer) {
      serialized = args[0].toString('hex');
    } else {
      [serialized] = args;
    }
    args.shift();

    const dppModelReference = await invokeFunctionFromIsolate(
      jail,
      objectPath,
      methodName,
      [serialized, ...args],
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
      return dpp[modelType].createFromObject(rawDppJson);
    } catch (e) {
      if (dppErrors.includes(e.name)) {
        // TODO: error handling. Need to catch an error from isolate and wrap it
        // into corresponding dpp error
      }
      throw e;
    }
  };
}

module.exports = wrapDppCreateMethod;
