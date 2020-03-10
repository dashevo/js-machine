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

function restoreConstructor(ErrorClass, properties) {
  // Restore original message

  // eslint-disable-next-line no-param-reassign
  properties.message = properties.originalMessage;
  // eslint-disable-next-line no-param-reassign
  delete properties.originalMessage;

  // Create an empty instance and merge properties
  const error = new ErrorClass({});
  Object.assign(error, properties);

  return error;
}

/**
 * @param {Error} error
 */
function handleIsolatedDppInvalidError(error) {
  if (!invalidErrors[error.name]) {
    return;
  }

  const invalidErrorProperties = JSON.parse(error.message);

  throw restoreConstructor(invalidErrors[error.name], invalidErrorProperties);
}

module.exports = handleIsolatedDppInvalidError;
