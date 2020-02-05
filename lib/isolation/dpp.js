// Isolates do not have timers, so we need to add them
require("setimmediate");
global.setTimeout = setImmediate;

const DashPlatformProtocol = require('@dashevo/dpp');

const protocol = new DashPlatformProtocol();

log.apply(undefined, ['Dpp loaded']);

module.exports = protocol;
