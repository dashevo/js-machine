const fs = require('fs');
const path = require('path');

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

const consensusErrorsPath = path.join(
  __dirname, '..', '..', '..', 'node_modules', '@dashevo', 'dpp', 'lib', 'errors',
);

const consensusErrors = fs.readdirSync(consensusErrorsPath)
  .reduce((map, errorFileName) => {
    const errorName = errorFileName.split('.')[0];
    // eslint-disable-next-line
    map[errorName] = require(path.join(consensusErrorsPath, errorFileName));
    return map;
  }, {});

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

  invalidErrorProperties.errors = invalidErrorProperties.errors.map((e) => {
    if (!consensusErrors[e.name]) {
      return e;
    }

    return restoreConstructor(consensusErrors[e.name], e);
  });

  throw restoreConstructor(invalidErrors[error.name], invalidErrorProperties);
}

module.exports = handleIsolatedDppInvalidError;
