const { Reference, ExternalCopy } = require('isolated-vm');

function wrapDataProviderReference(methodNames) {
  const dataProvider = {};
  methodNames.forEach((methodName) => {
    const methodRefence = dataProviderExternalReference.getSync(methodName);
    dataProvider[methodName] = async function f(...args) {
      return methodRefence.apply(dataProviderExternalReference.derefInto(), args);
    };
  });

  dpp.setDataProvider(dataProvider);
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
