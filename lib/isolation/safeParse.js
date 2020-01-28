const {
  ExternalCopy, Reference, Isolate,
} = require('isolated-vm');

const isolate = new Isolate({
  memoryLimit: 16,
});
const timeoutInMillis = 1000;

async function parseFunction(stateTransition) {
  const dppStateTransitionFacadeReference = await externalDppReference.get('stateTransition');
  const identityCreateFromSerializedReference = await dppStateTransitionFacadeReference.get('createFromSerialized');

  return identityCreateFromSerializedReference.apply(
    undefined,
    [stateTransition],
    { result: { promise: true, copy: true } },
  );
}

/**
 *
 * @param dppInitializationCode
 * @returns {function(*): *}
 */
function createSafeParse(dppMock) {
  /**
   *
   * @param stateTransition
   * @returns {Promise<*>}
   */
  async function safeParse(stateTransition) {
    // Set up isolate
    const context = await isolate.createContext();
    const { global } = context;

    // await global.set('log', new Reference(console.log));
    // await global.set('dpp', new Reference(dppMock.identity.createFromSerialized));
    await global.set('externalDppReference', new Reference(dppMock));
    const script = await isolate.compileScript(`${parseFunction}`);
    await script.run(context, {
      timeout: timeoutInMillis,
      promise: true,
    });
    const parseFunctionReference = await context.global.get('parseFunction');

    const stateTransitionCopy = new ExternalCopy(stateTransition);
    // Run function
    return parseFunctionReference.apply(
      undefined,
      [stateTransitionCopy],
      {
        timeout: timeoutInMillis,
        result: { promise: true, copy: true },
      },
    );
  }

  return safeParse;
}

module.exports = createSafeParse;
