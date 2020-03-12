const DashPlatformProtocol = require('@dashevo/dpp');

class IsolatedDashPlatformProtocol extends DashPlatformProtocol {
  constructor(isolate, options) {
    super(options);

    this.isolate = isolate;
  }

  getIsolate() {
    return this.isolate;
  }

  dispose() {
    this.getIsolate().dispose();
  }
}

module.exports = IsolatedDashPlatformProtocol;
