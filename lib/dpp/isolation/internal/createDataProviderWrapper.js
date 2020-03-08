// This file is to use within the isolate. Please do not import this file outside of the isolate
const IsolatedDataProvider = require('../IsolatedDataProviderWrapper');

module.exports = function bootstrapDataProvider() {
  let dataProvider;

  // eslint-disable-next-line no-undef
  if (dataProviderExternalReference) {
    // eslint-disable-next-line no-undef
    dataProvider = new IsolatedDataProvider(dataProviderExternalReference);
  }

  return dataProvider;
};
