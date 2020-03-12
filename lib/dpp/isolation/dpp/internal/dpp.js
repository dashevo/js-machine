// This file is to use within the isolate. Please do not import this file outside of the isolate
const DashPlatformProtocol = require('@dashevo/dpp');

const ConsensusError = require('@dashevo/dpp/lib/errors/ConsensusError');
const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const InvalidDataContractError = require('@dashevo/dpp/lib/dataContract/errors/InvalidDataContractError');
const InvalidDocumentError = require('@dashevo/dpp/lib/document/errors/InvalidDocumentError');
const InvalidIdentityError = require('@dashevo/dpp/lib/identity/errors/InvalidIdentityError');

const ExternalDataProvider = require('./ExternalDataProvider');

// setImmediate shim
require('setimmediate');

// Patch errors in order to pass all error properties from isolate
[
  InvalidStateTransitionError,
  InvalidDataContractError,
  InvalidDocumentError,
  InvalidIdentityError,
  ConsensusError,
].forEach((ErrorClass) => {
  Object.defineProperty(ErrorClass.prototype, 'message', {
    get() {
      return JSON.stringify(this);
    },

    set(message) {
      this.originalMessage = message;
    },
  });
});

module.exports = {
  DashPlatformProtocol,
  ExternalDataProvider,
  createTimeoutShim() {
    return setImmediate;
  },
};
