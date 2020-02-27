const { Reference, ExternalCopy } = require('isolated-vm');
const compileFile = require('./compileFileWithBrowserify');

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
