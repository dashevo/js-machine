// Isolates do not have timers, so we need to add them
require("setimmediate");
global.setTimeout = setImmediate;

const DashPlatformProtocol = require('@dashevo/dpp');
const internalDpp = new DashPlatformProtocol();

const dataProvider = {};

module.exports = dataProvider;
