const handleIsolatedInvalidError = require('./handleIsolatedDppInvalidError');
const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

/**
 * Wraps dpp 'create' method, i.e. dpp.stateTransition.createFromObject and similar methods.
 * @param {function():module:isolated-vm.Context} bootstrapIsolate -
 * function to bootstrap an isolate
 * @param {string} objectPath - path to a object in a global namespace withing the isolate,
 * i.e. dpp.stateTransition
 * @param {string} methodName - method name of the above object to call. For example, 'create'
 * @param {Object} executionOptions - isolated-vm execution options
 * @param {DashPlatformProtocol} dpp - external dpp
 * to create models from jsons
 * @param {string} facadeName -
 * can be 'document', 'stateTransition', 'identity', 'dataContract'
 * @returns {dppCreateMethod}
 */
function wrapDppCreateMethod(
  bootstrapIsolate,
  objectPath,
  methodName,
  executionOptions,
  dpp,
  facadeName,
) {
  /**
   * Invokes create method from dpp and returns an instance of corresponding dpp model
   * @typedef dppCreateMethod
   * return {StateTransition|Document|Identity|DataContract}
   */
  return async function dppCreateMethod(...args) {
    // Bootstrapping an isolate from a snapshot
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

    // This is a reference to model created by dpp inside the isolate
    let dppModelReference;
    try {
      dppModelReference = await invokeFunctionFromIsolate(
        jail,
        objectPath,
        methodName,
        [serialized, ...args],
        executionOptions,
      );
    } catch (e) {
      handleIsolatedInvalidError(e);

      throw e;
    }

    // Copy the data from the reference to the main thread using .toJSON method
    const rawDppJson = await dppModelReference
      .getSync('toJSON')
      .apply(
        dppModelReference.derefInto(),
        [],
        { ...executionOptions, ...{ result: { copy: true } } },
      );

    // Wrapping copied data from the isolate to the model instance,
    // so the isolated dpp interface remains the same.
    // Validation is not needed at this point,
    // since the validation already were performed inside the isolate.
    return dpp[facadeName].createFromObject(rawDppJson, { skipValidation: true });
  };
}

module.exports = wrapDppCreateMethod;
