const createIsolated = require('./createIsolatedModule');

const isolate = createIsolated();
const timeoutInMillis = 1000;

function parseFunction(stateTransition) {

}

async function createSafeParse(dppInitializationCode) {
  /**
   *
   * @param stateTransition
   * @returns {Promise<*>}
   */
  async function safeParse(stateTransition) {
    // Set up isolate
    const context = await isolate.createContext();
    const { global } = context;
    const dppModule = await isolate.compileModule(dppInitializationCode);
    await global.set('dpp', dppModule);
    const script = await isolate.compileScript(`${parseFunction}`);
    await script.run(context, {
      timeout: timeoutInMillis,
    });
    const parseFunctionReference = await context.global.get('parseFunction');

    // Run function
    return parseFunctionReference.apply(undefined, [stateTransition]);
  }

  return safeParse;
}

module.exports = createSafeParse;
