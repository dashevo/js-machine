const { Reference, ExternalCopy } = require('isolated-vm');

function wrapDataProviderReference() {
  global.dataProvider = {};
  dataProviderMethods.forEach((methodName) => {
    const methodReference = dataProviderExternalReference.getSync(methodName);
    global.dataProvider[methodName] = async function f(...args) {
      return methodReference.apply(
        dataProviderExternalReference.derefInto(),
        args,
        { arguments: { copy: true }, result: { promise: true, copy: true } },
      );
    };
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

  await context.global.set('dataProviderExternalReference', new Reference(dataProvider));
  await context.global.set('dataProviderMethods', new ExternalCopy(dataProviderMethodNames).copyInto());

  await context.eval(`${wrapDataProviderReference}`);
  await context.eval('wrapDataProviderReference();');
}

module.exports = createDataProviderReference;
