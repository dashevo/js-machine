const cbor = require('cbor');

function getRequestTxFixture(stHeader, stPacket) {
  const st = {
    header: stHeader.serialize(),
    packet: stPacket.serialize(),
  };

  return cbor.encode(st);
}

module.exports = getRequestTxFixture;
