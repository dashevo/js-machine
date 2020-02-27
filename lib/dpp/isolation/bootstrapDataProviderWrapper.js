// Isolates do not have timers, so we need to add them
require("setimmediate");
global.setTimeout = setImmediate;
const IsolatedDataProvider = require('./IsolatedDataProviderWrapper');

const dataProvider = new IsolatedDataProvider(dataProviderExternalReference);

module.exports = dataProvider;
