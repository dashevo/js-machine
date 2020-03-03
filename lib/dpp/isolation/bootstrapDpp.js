const DashPlatformProtocol = require('@dashevo/dpp');

module.exports = function bootstrapDpp(dataProvider) {
  return new DashPlatformProtocol({ dataProvider });
};
