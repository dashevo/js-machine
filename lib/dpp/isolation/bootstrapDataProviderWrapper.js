// Isolates do not have timers, so we need to add them
const IsolatedDataProvider = require('./IsolatedDataProviderWrapper');

module.exports = function bootstrapDataProvider() {
  let dataProvider;

  if (dataProviderExternalReference) {
    dataProvider = new IsolatedDataProvider(dataProviderExternalReference);
  }

  return dataProvider;
};
