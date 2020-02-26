const compileFile = require('./compileFileWithBrowserify');
const createDataProviderInContext = require('./createDataProviderInContext');

/**
 * Compiles dpp and adds it to the context
 * @param {Context} context - context to add dpp
 * @param {DataProvider} dataProvider - data provider to use in the dpp.
 * @returns {Promise<void>}
 */
async function createDppInContext(context, dataProvider) {
  // This function creates global variable with name 'dataProvider' that wraps
  // external data provider and makes it works inside the isolate
  await createDataProviderInContext(dataProvider, context);

  const dppBootstrapCode = await compileFile('./bootstrapDpp', 'dpp');
  await context.eval(dppBootstrapCode);
}

module.exports = createDppInContext;
