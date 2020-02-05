const {
  ExternalCopy, Reference, Isolate,
} = require('isolated-vm');

const browserify = require('browserify');

const timeoutInMillis = 1000;
const memoryLimit = 16;

const fs = require('fs');

console.log('kek');

const devPath = require.resolve('../../../js-dpp/dist/DashPlatformProtocol.dev');
const dppFilePath = require.resolve('@dashevo/dpp/dist/DashPlatformProtocol.min');

async function parseFunction(stateTransition, st2) {
  await time.apply(undefined, ['c']);
  await log.apply(undefined, ['state transition length', stateTransition.length], { arguments: { copy: true } });
  // const buf = Buffer.from(stateTransition);
  // await log.apply(undefined, ['buf length', buf.length]);
  // await log.apply(undefined, [buf.toString('hex')], { arguments: { copy: true } });
  // const st = new dpp.stateTransition.create();

  await log.apply(undefined, ['peis']);
  const st2p = await dpp.stateTransition.createFromObject(st2, { skipValidation: true });
  await log.apply(undefined, ['kek']);
  const ser = await st2p.serialize();
  await log.apply('three');

  await log.apply(undefined, [], { arguments: { copy: true } });

  const res = await dpp.stateTransition.createFromSerialized(
    stateTransition,
    { skipValidation: true },
  );

  await log.apply('After dpp');
  await timeEnd.apply(undefined, ['c']);

  return res;
}

async function compileFile(path) {
  return new Promise((resolve, reject) => {
    browserify(require.resolve('@dashevo/dpp')).bundle((err, buf) => {
      if (err) {
        return reject(err);
      }
      return resolve(buf.toString());
    });
  });
}

async function createDppInContext(context, dataProvider, isolate) {
  const dppCode = await compileFile(require.resolve('./dpp'));// fs.readFileSync(devPath, 'utf8');
  // console.log(dppCode);
  const script = await isolate.compileScript(dppCode);
  const res = await script.run();
  await context.eval(dppCode);

  await createDataProviderReference(dataProvider, context);
  // await context.eval('');

  // await context.eval('const dpp = new DashPlatformProtocol();');
}

async function loadBufferModuleToContext(context) {
  const bufferModulePath = require.resolve('./Buffer');
  const bufferCode = fs.readFileSync(bufferModulePath, 'utf8');
  await context.eval(bufferCode);
  await context.eval('const Buffer = buffer.Buffer;');
}

async function createDataProviderReference(dataProvider, context) {
  if (!dataProvider) {
    throw new Error('dataProvider is not present');
  }
  const dataProviderMethodNames = Object.keys(dataProvider);

  await context.global.set('dataProvider', new Reference(dataProvider));
  await context.global.set('dataProviderMethods', new ExternalCopy(dataProviderMethodNames).copyInto());
}

/**
 *
 * @param dataProvider
 * @returns {function(*): *}
 */
async function createSafeParse(dataProvider) {
  // Set up isolate
  const isolate = new Isolate({
    memoryLimit,
  });
  const context = await isolate.createContext();
  const { global: jail } = context;
  // Setting window to be equal global in dpp, as bundled dpp will try to kek
  jail.setSync('window', jail.derefInto());
  jail.setSync('global', jail.derefInto());

  await jail.set('time', new Reference(console.time));
  await jail.set('timeEnd', new Reference(console.timeEnd));
  await jail.set('log', new Reference(console.log));

  // IMPORTANT: Please note that isolates do not have Buffer that dpp uses,
  // so we need to load this module to the context
  // await loadBufferModuleToContext(context);
  // This will add DashPlatformProtocol class to isolate instantiate it under the name 'dpp'
  await createDppInContext(context, dataProvider);

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
  async function safeParse(stateTransition, st2) {
    console.time('d');

    console.log(stateTransition.length);

    const res = await parseFunctionReference.apply(
      undefined,
      [stateTransition.toString('hex'), new ExternalCopy(st2).copyInto()],
      {
        timeout: timeoutInMillis,
        result: {
          promise: true,
          copy: true,
        },
        memoryLimit,
      },
    );

    console.timeEnd('d');

    return res;
  }

  return safeParse;
}

module.exports = createSafeParse;
