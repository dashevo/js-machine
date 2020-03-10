/**
 * @param {number} ms
 * @param {Promise} promise
 * @returns {Promise<*>}
 */
function promiseTimeout(ms, promise) {
  if (!ms) {
    return promise;
  }

  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('Script execution timed out.'));
    }, ms);
  });

  return Promise.race([
    promise,
    timeout,
  ]);
}

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
      objectReference = await objectReference.get(property);
    }
  }

  if (!objectReference) { objectReference = jail; }

  const methodReference = await objectReference.get(methodName);

  const promise = methodReference.apply(
    objectReference ? objectReference.derefInto() : null,
    args,
    options,
  );

  return promiseTimeout(options.timeout, promise);
}

module.exports = invokeFunctionFromIsolate;
