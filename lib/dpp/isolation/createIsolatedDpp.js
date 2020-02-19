const {
  ExternalCopy, Reference, Isolate,
} = require('isolated-vm');

const browserify = require('browserify');
const DashPlatformProtocol = require('@dashevo/dpp');

const timeoutInMillis = 1000;
const memoryLimit = 128;

const defaultExecutionOptions = {
  timeout: timeoutInMillis,
  arguments: {
    copy: true,
  },
  result: {
    promise: true,
  },
};

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

async function invokeFunctionFromReference(referencePath, methodName, args, options) {
  const properties = referencePath.split('.');
  let objectReference;

  for (const property of properties) {
    if (!objectReference) {
      objectReference = global[property];
    } else {
      objectReference = await objectReference.get(property);
    }
  }

  const methodReference = objectReference
    ? await objectReference.get(methodName)
    : global[methodName];

  return methodReference.apply(
    objectReference.derefInto(),
    args,
    options,
  );
}

/**
 * Compiles dpp and adds it to the context
 * @param {Context} context - context to add dpp
 * @param {DataProvider} dataProvider - data provider to use in the dpp.
 * @returns {Promise<void>}
 */
async function createDppInContext(context, dataProvider) {
  const dppCode = await compileFile('./bootstrapDpp', 'dpp');

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
    objectReference.derefInto(),
    args,
    options,
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
async function createIsolatedDpp(dataProvider) {
  // Set up isolate
  const isolate = new Isolate({
    memoryLimit,
  });
  const context = await isolate.createContext();
  const { global: jail } = context;
  await jail.set('global', jail.derefInto());

  // This adds this function to the context, so we can use it to make calls to DataProvider
  await context.eval(`${invokeFunctionFromReference}`);
  // This will instantiate 'dpp' into the isolate
  await createDppInContext(context, dataProvider);

  const dpp = new DashPlatformProtocol(dataProvider);

  return {
    stateTransition: {
      async createFromSerialized(...args) {
        const rawStReference = await invokeFunctionFromIsolate(
          jail,
          'dpp.stateTransition',
          'createFromSerialized',
          args,
          defaultExecutionOptions,
        );

        const stJson = await rawStReference
          .getSync('toJSON')
          .apply(
            rawStReference.derefInto(),
            [],
            { ...defaultExecutionOptions, ...{ result: { copy: true } } },
          );

        return dpp.stateTransition.createStateTransition(stJson);
      },
      async createFromObject(...args) {
        const rawStReference = await invokeFunctionFromIsolate(
          jail,
          'dpp.stateTransition',
          'createFromObject',
          args,
          defaultExecutionOptions,
        );

        const stJson = await rawStReference
          .getSync('toJSON')
          .apply(
            rawStReference.derefInto(),
            [],
            { ...defaultExecutionOptions, ...{ result: { copy: true } } },
          );

        return dpp.stateTransition.createStateTransition(stJson);
      },
    },
  };
}

module.exports = createIsolatedDpp;
