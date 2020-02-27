const { Reference, ExternalCopy } = require('isolated-vm');
const compileFile = require('./compileFileWithBrowserify');

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

  await context.global.set('dataProviderExternalReference', new Reference(dataProvider));

  const bootstrapDataProviderCode = await compileFile('./bootstrapDataProviderWrapper', 'dataProvider');
  await context.eval(bootstrapDataProviderCode);
}

module.exports = createDataProviderReference;
