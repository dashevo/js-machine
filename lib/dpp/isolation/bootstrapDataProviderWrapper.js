// Isolates do not have timers, so we need to add them
require("setimmediate");
global.setTimeout = setImmediate;
const IsolatedDataProvider = require('./IsolatedDataProviderWrapper');

let dataProvider;

if (dataProviderExternalReference) {
  dataProvider = new IsolatedDataProvider(dataProviderExternalReference);
}

module.exports = dataProvider;
