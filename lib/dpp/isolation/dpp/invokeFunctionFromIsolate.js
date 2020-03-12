const rejectAfter = require('../../../utils/rejectAfter');

/**
 * Invokes method inside the isolate and returns copy of the execution result
 * @param {Context} context - reference to the isolate's context's global object
 * @param {string} objectPath - path of the object on which to invoke method,
 * i.e. 'dpp.stateTransition'
 * @param {string} methodName - method name to invoke.
 * If desirable method is dpp.stateTransition.create,
 * then the value of this argument must be 'create'
 * @param {*[]} args - an array of arguments to pass to the invoked method
 * @param {Object} options - additional option for the isolate
 * @returns {Promise<*>}
 */
async function invokeFunctionFromIsolate(
  context, objectPath, methodName, args, options = {},
) {
  const properties = objectPath.split('.');
  const { global: jail } = context;

  let objectReference;

  for (const property of properties) {
    if (!objectReference) {
      objectReference = await jail.get(property);
    } else {
      // noinspection JSUnusedAssignment
      objectReference = await objectReference.get(property);
    }
  }

  if (!objectReference) { objectReference = jail; }

  const methodReference = await objectReference.get(methodName);

  const methodInvokePromise = methodReference.apply(
    objectReference ? objectReference.derefInto() : null,
    args,
    options,
  );

  if (!options.timeout) {
    return methodInvokePromise;
  }

  const timeoutError = new Error('Script execution timed out.');

  return rejectAfter(methodInvokePromise, timeoutError, options.timeout);
}

module.exports = invokeFunctionFromIsolate;
