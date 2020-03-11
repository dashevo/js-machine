const DashPlatformProtocol = require('@dashevo/dpp');

class IsolatedDashPlatformProtocol extends DashPlatformProtocol {
  constructor(props) {
    super(props);

  }


  dispose() {
    this.jsonSchemaValidator.getIsolate().dispose();
  }
}

module.exports = IsolatedDashPlatformProtocol;
