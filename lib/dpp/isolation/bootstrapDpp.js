// Isolates do not have timers, so we need to add them
require("setimmediate");
global.setTimeout = setImmediate;

const DashPlatformProtocol = require('@dashevo/dpp');

const dpp = new DashPlatformProtocol({ dataProvider });

module.exports = dpp;
