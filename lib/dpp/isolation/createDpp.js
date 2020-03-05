// This file is to use withing the isolate. Please do not import this file outside of the isolate
const DashPlatformProtocol = require('@dashevo/dpp');

const ConsensusError = require('@dashevo/dpp/lib/errors/ConsensusError');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');


Object.defineProperty(InvalidStateTransitionError.prototype, 'message', {
  get() {
    return `encodedError${JSON.stringify(this)}`;
  },

  set(message) {
    this.originalMessage = message;
  },
});


Object.defineProperty(ConsensusError.prototype, 'message', {
  get() {
    return `encodedError${JSON.stringify(this)}`;
  },

  set(message) {
    this.originalMessage = message;
  },
});

module.exports = function bootstrapDpp(dataProvider) {
  return new DashPlatformProtocol({ dataProvider });
};
