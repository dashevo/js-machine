// This file is to use within the isolate. Please do not import this file outside of the isolate
// require('setimmediate');
// setTimeout.js = setImmediate;
const DashPlatformProtocol = require('@dashevo/dpp');

const ConsensusError = require('@dashevo/dpp/lib/errors/ConsensusError');
const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const InvalidDataContractError = require('@dashevo/dpp/lib/dataContract/errors/InvalidDataContractError');
const InvalidDocumentError = require('@dashevo/dpp/lib/document/errors/InvalidDocumentError');
const InvalidIdentityError = require('@dashevo/dpp/lib/identity/errors/InvalidIdentityError');

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

function bootstrapDpp(dataProvider) {
  return new DashPlatformProtocol({ dataProvider });
}

const rawStateTransition = {
  protocolVersion: 0,
  type: 3,
  signature: 'H1kOzA+sRuy/dtvYZsdUZ793GuxH2JAwvsbg16m37DodULJLZ7Y/hzPhBCvIxjLiZRwwXcf94aIgZglrm7i6Eo0=',
  signaturePublicKeyId: 1,
  identityType: 1,
  lockedOutPoint: 'A+sRuy/dtvYZsdUZ793GuxH2JAwvsbg16m37DodULJLZ7Y/h',
  publicKeys: [
    {
      id: 1,
      type: 1,
      data: 'A6zlANVwDKO2/qu6hpAsgBR/qpPc/GCkvsIzyt7IurgM',
      isEnabled: true,
    },
  ],
};

// const warmupDpp = bootstrapDpp({
//   fetchIdentity() {},
//   fetchDataContract() {},
//   fetchTransaction() {},
//   fetchDocuments() {},
// });
//
// warmupDpp.stateTransition.validateData(rawStateTransition).catch((e) => { });

module.exports = bootstrapDpp;
