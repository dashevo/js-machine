const {
  ExternalCopy, Reference, Isolate,
} = require('isolated-vm');

const browserify = require('browserify');

const timeoutInMillis = 1000;
const memoryLimit = 128;

async function parseFunction(stateTransition, options) {
  return dpp.stateTransition.createFromSerialized(
    stateTransition,
    options,
  );
}

/**
 * @param path
 * @returns {Promise<string>}
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

async function createDppInContext(context, dataProvider, isolate) {
  const dppCode = await compileFile('./dpp', 'dpp');

  await createDataProviderReference(dataProvider, context);

  await context.eval(dppCode);
}

async function createDataProviderReference(dataProvider, context) {
  if (!dataProvider) {
    throw new Error('dataProvider is not present');
  }
  const dataProviderMethodNames = Object.keys(dataProvider);

  await context.global.set('dataProvider', new Reference(dataProvider));
  await context.global.set('dataProviderMethods', new ExternalCopy(dataProviderMethodNames).copyInto());
}

async function invokeFunctionFromIsolate(jail, path, args) {
  const properties = path.split('.');
  let methodReference;

  for (const property of properties) {
    if (!methodReference) {
      methodReference = await jail.get(property);
    } else {
      methodReference = await methodReference.get(property);
    }
  }

  return methodReference.apply(
    undefined,
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
 *
 * @param dataProvider
 * @returns {Promise<{stateTransition: {createFromSerialized(...[*]=): Promise<void>}}|void>}
 */
async function createSafeDPP(dataProvider) {
  // Set up isolate
  const isolate = new Isolate({
    memoryLimit,
  });
  const context = await isolate.createContext();
  const { global: jail } = context;
  jail.setSync('global', jail.derefInto());

  await jail.set('time', new Reference(console.time));
  await jail.set('timeEnd', new Reference(console.timeEnd));
  await jail.set('log', new Reference(console.log));

  // This will instantiate 'dpp' into the isolate
  await createDppInContext(context, dataProvider, isolate);

  // Compile parse function
  const script = await isolate.compileScript(`${parseFunction}`);
  await script.run(context, {
    timeout: timeoutInMillis,
  });

  const parseFunctionReference = await jail.get('parseFunction');

  /**
   *
   * @param stateTransition
   * @returns {Promise<*>}
   */
  async function safeParse(args) {
    return parseFunctionReference.apply(
      undefined,
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

  return {
    stateTransition: {
      async createFromSerialized(...args) {
        return safeParse(args);
        //return invokeFunctionFromIsolate(jail, 'dpp.stateTransition.createFromSerialized', args);
      },
    },
  };

}

module.exports = createSafeDPP;
