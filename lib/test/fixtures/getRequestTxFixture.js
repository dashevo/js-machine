const cbor = require('cbor');

function getRequestTxFixture(stateTransition) {
  const st = {
    stateTransition: stateTransition.serialize(),
  };

  return cbor.encode(st);
}

module.exports = getRequestTxFixture;
