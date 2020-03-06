const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const InvalidDataContractError = require('@dashevo/dpp/lib/dataContract/errors/InvalidDataContractError');
const InvalidDocumentError = require('@dashevo/dpp/lib/document/errors/InvalidDocumentError');
const InvalidIdentityError = require('@dashevo/dpp/lib/identity/errors/InvalidIdentityError');

const invalidErrors = {
  InvalidStateTransitionError,
  InvalidDataContractError,
  InvalidDocumentError,
  InvalidIdentityError,
};

function restoreOriginalMessage(object) {
  // eslint-disable-next-line no-param-reassign
  object.message = object.originalMessage;
  // eslint-disable-next-line no-param-reassign
  delete object.originalMessage;
}

/**
 * @param {Error} error
 */
function handleIsolatedDppInvalidError(error) {
  if (!invalidErrors[error.name]) {
    return;
  }

  const invalidErrorProperties = JSON.parse(error.message);

  // Restore original message for invalid error
  // and included consensus errors
  restoreOriginalMessage(invalidErrorProperties);
  invalidErrorProperties.errors.forEach(restoreOriginalMessage);

  const invalidError = new invalidErrors[error.name]();
  Object.assign(invalidError, invalidErrorProperties);

  throw invalidError;
}

module.exports = handleIsolatedDppInvalidError;
