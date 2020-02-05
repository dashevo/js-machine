// Isolates do not have timers, so we need to add them
require("setimmediate");
global.setTimeout = setImmediate;

const DashPlatformProtocol = require('@dashevo/dpp');

const protocol = new DashPlatformProtocol();

module.exports = protocol;
