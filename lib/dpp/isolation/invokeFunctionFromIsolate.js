const rejectAfter = require('../../utils/rejectAfter');

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
let cachedData;

async function invokeFunctionFromIsolate(
  context, objectPath, methodName, args, options = {},
) {
  // const properties = objectPath.split('.');
  const { global: jail } = context;

  // let objectReference;
  //
  // for (const property of properties) {
  //   if (!objectReference) {
  //     objectReference = await jail.get(property);
  //   } else {
  //     // noinspection JSUnusedAssignment
  //     objectReference = await objectReference.get(property);
  //   }
  // }
  //
  // if (!objectReference) { objectReference = jail; }

  console.time('settig up stuff');

  console.time('copy');
  await jail.set('args', args, { copy: true });
  console.timeEnd('copy');


  const method = objectPath ? `${objectPath}.${methodName}` : methodName;

  const code = `
    console.time('inside');
    console.log('datedpp', Date.now());
    ${method}(...args)
      .then(res => { console.timeEnd('inside'); invokeResult = res; });
  `;

  console.time('eval');
  const resp = await context.eval(code);
  cachedData = resp.cachedData;
  console.timeEnd('eval');

  const methodInvokePromise = new Promise(async (resolve) => {
    let cycles = 0;
    let result = null;
    while (!result) {
      cycles++;
      console.time(cycles);
      result = await jail.get('invokeResult');
      console.timeEnd(cycles);
    }
    console.log('cycles', cycles);
    resolve(result);
  });

  // const methodReference = await objectReference.get(methodName);

  // const methodInvokePromise = methodReference.apply(
  //   objectReference ? objectReference.derefInto() : null,
  //   args,
  //   options,
  // );

  if (!options.timeout) {
    return methodInvokePromise;
  }

  const timeoutError = new Error('Script execution timed out.');

  console.time('v');
  const res = await methodInvokePromise;
  console.timeEnd('v');
  console.timeEnd('settig up stuff');
  return res;
  // return rejectAfter(methodInvokePromise, timeoutError, options.timeout);
}

module.exports = invokeFunctionFromIsolate;
