const {
  ExternalCopy, Reference, Isolate,
} = require('isolated-vm');

const browserify = require('browserify');

const timeoutInMillis = 1000;
const memoryLimit = 128;

/**
 * Compiles given module to standalone text representation using browserify
 * @param {string} path - relative or absolute path to file
 * @param {string} globalName - result of the file execution will be assigned to the global variable
 * @returns {Promise<string>} - compiled code
 */
async function compileFile(path, globalName) {
  return new Promise((resolve, reject) => {
    browserify(require.resolve(path), { standalone: globalName }).bundle((err, buf) => {
      if (err) {
        return reject(err);
      }
      return resolve(buf.toString());
    });
  });
}

/**
 * Creates a reference to a given data provider to use in dpp
 * @param {DataProvider} dataProvider
 * @param {Context} context
 * @returns {Promise<void>}
 */
async function createDataProviderReference(dataProvider, context) {
  if (!dataProvider) {
    throw new Error('dataProvider is not present');
  }
  const dataProviderMethodNames = Object.keys(dataProvider);

  await context.global.set('dataProvider', new Reference(dataProvider));
  await context.global.set('dataProviderMethods', new ExternalCopy(dataProviderMethodNames).copyInto());
}

/**
 * Compiles dpp and adds it to the context
 * @param {Context} context - context to add dpp
 * @param {DataProvider} dataProvider - data provider to use in the dpp.
 * @returns {Promise<void>}
 */
async function createDppInContext(context, dataProvider) {
  const dppCode = await compileFile('./dpp', 'dpp');

  await createDataProviderReference(dataProvider, context);

  await context.eval(dppCode);
}

/**
 * Invokes method inside the isolate and returns copy of the execution result
 * @param {Reference} jail - reference to the isolate's context's global object
 * @param {string} objectPath - path of the object on which to invoke method,
 * i.e. 'dpp.stateTransition'
 * @param {string} methodName - method name to invoke.
 * If desirable method is dpp.stateTransition.create,
 * then the value of this argument must be 'create'
 * @param {*[]} args - an array of arguments to pass to the invoked method
 * @returns {Promise<*>}
 */
async function invokeFunctionFromIsolate(jail, objectPath, methodName, args) {
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
    objectReference.derefInto(),
    args,
    {
      timeout: timeoutInMillis,
      result: {
        promise: true,
        copy: true,
      },
      arguments: {
        copy: true,
      },
      memoryLimit,
    },
  );
}

/**
 * Creates an instance of dpp that will run in it's own virtual machine
 * Please note that to parse serialized entities you need to pass a string instead of buffer,
 * since isolates copies buffers as UInt8Array, and the current version of
 * dpp can work only with buffers.
 * Also, it will always return raw objects instead of instances
 * @param {DataProvider} dataProvider
 * @returns {Promise<{stateTransition: {createFromSerialized(string, object): Promise<Object>}}>}
 */
async function createIsolatedDPP(dataProvider) {
  // Set up isolate
  const isolate = new Isolate({
    memoryLimit,
  });
  const context = await isolate.createContext();
  const { global: jail } = context;
  await jail.set('global', jail.derefInto());

  // await jail.set('time', new Reference(console.time));
  // await jail.set('timeEnd', new Reference(console.timeEnd));
  // await jail.set('log', new Reference(console.log));

  // This will instantiate 'dpp' into the isolate
  await createDppInContext(context, dataProvider);

  return {
    stateTransition: {
      async createFromSerialized(...args) {
        return invokeFunctionFromIsolate(
          jail,
          'dpp.stateTransition',
          'createFromSerialized',
          args,
        );
      },
    },
  };
}

module.exports = createIsolatedDPP;
