const DashPlatformProtocol = require('@dashevo/dpp');

class IsolatedDashPlatformProtocol extends DashPlatformProtocol {
  constructor(isolate, options) {
    super(options);

    this.isolate = isolate;
  }

  dispose() {
    this.isolate.dispose();
  }
}

module.exports = IsolatedDashPlatformProtocol;
