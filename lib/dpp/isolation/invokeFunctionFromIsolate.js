const { ExternalCopy, Script } = require('isolated-vm');

/**
 * Invokes method inside the isolate and returns copy of the execution result
 * @param {Reference} jail - reference to the isolate's context's global object
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
  jail, objectPath, methodName, args, options = {},
) {
  const properties = objectPath.split('.');
  let objectReference;

  for (const property of properties) {
    if (!objectReference) {
      objectReference = await jail.get(property);
    } else {
      objectReference = await objectReference.get(property);
    }
  }

  const methodReference = objectReference
    ? await objectReference.get(methodName)
    : await jail.get(methodName);

  return methodReference.apply(
    objectReference ? objectReference.derefInto() : null,
    args,
    options,
  );

  // const { global: g } = jail;
  //
  // g.setSync('args', new ExternalCopy(args));
  //
  // const fullPath = objectPath.length > 0 ? `${objectPath}.${methodName}` : methodName;
  //
  // const code = `
  //   return ${fullPath}($0);
  // `;
  //
  // console.log(code);
  //
  // const res = await jail.evalClosure(code, args, options);
  // return res.result;
}

module.exports = invokeFunctionFromIsolate;
