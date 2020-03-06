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
  const error = new ErrorClass();
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

  invalidErrorProperties.errors = invalidErrorProperties.errors.map((error) => {
    if (!consensusErrors[error.name]) {
      return error;
    }

    return restoreConstructor(consensusErrors[error.name], error);
  });

  const invalidError = restoreConstructor(invalidErrors[error.name], invalidErrorProperties);

  throw invalidError;
}

module.exports = handleIsolatedDppInvalidError;
