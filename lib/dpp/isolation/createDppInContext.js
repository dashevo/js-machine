const compileFile = require('./compileFileWithBrowserify');
const createDataProviderInContext = require('./createDataProviderInContext');

/**
 * Compiles dpp and adds it to the context
 * @param {Context} context - context to add dpp
 * @param {DataProvider} dataProvider - data provider to use in the dpp.
 * @returns {Promise<void>}
 */
async function createDppInContext(context, dataProvider) {
  const dppCode = await compileFile('./bootstrapDpp', 'dpp');

  await createDataProviderInContext(dataProvider, context);

  await context.eval(dppCode);
}

module.exports = createDppInContext;
