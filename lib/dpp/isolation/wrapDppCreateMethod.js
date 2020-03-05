const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

const dppErrors = {
  InvalidStateTransitionError,
};

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
      if (dppErrors[e.name]) {
        const errorProperties = JSON.parse(e.message.substring('encodedError'.length));
        const error = new dppErrors[e.name]();

        Object.assign(error, errorProperties);

        throw error;
      }

      // TODO handle memory and cputime error (maybe just external timeout?)

      throw e;
    }

    const rawDppJson = await dppModelReference
      .getSync('toJSON')
      .apply(
        dppModelReference.derefInto(),
        [],
        { ...executionOptions, ...{ result: { copy: true } } },
      );


    return dpp[modelType].createFromObject(rawDppJson, { skipValidation: true });
  };
}

module.exports = wrapDppCreateMethod;
