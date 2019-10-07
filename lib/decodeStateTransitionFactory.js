const cbor = require('cbor');

const { Transaction } = require('@dashevo/dashcore-lib');

const InvalidSTPacketError = require('@dashevo/dpp/lib/stPacket/errors/InvalidSTPacketError');

const InvalidArgumentAbciError = require('./abci/errors/InvalidArgumentAbciError');


/**
 * @param {DashPlatformProtocol} dpp
 * @return {decodeStateTransition}
 */
function decodeStateTransitionFactory(dpp) {
  /**
   * @typedef decodeStateTransition
   *
   * @param {Uint8Array} stateTransition
   * @return {{ stHeader: Transaction, stPacket: STPacket }}
   */
  async function decodeStateTransition(stateTransition) {
    const tx = Buffer.from(stateTransition);
    const unserialized = cbor.decode(tx);

    const { header: stHeaderBinary, packet: stPacketBinary } = unserialized;

    if (!stHeaderBinary) {
      throw new InvalidArgumentAbciError('stHeader is not specified');
    }

    if (!stPacketBinary) {
      throw new InvalidArgumentAbciError('stPacket is not specified');
    }

    // Validate ST Header
    let stHeader;

    try {
      stHeader = new Transaction(stHeaderBinary);
    } catch (e) {
      throw new InvalidArgumentAbciError('stHeader is invalid', { error: e.message });
    }

    if (!stHeader.isSpecialTransaction()
      || stHeader.type !== Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION) {
      throw new InvalidArgumentAbciError('stHeader type is invalid');
    }

    let stPacket;
    try {
      stPacket = await dpp.packet.createFromSerialized(stPacketBinary);
    } catch (e) {
      if (e instanceof InvalidSTPacketError) {
        throw new InvalidArgumentAbciError('stPacket is invalid', { errors: e.getErrors() });
      }

      throw e;
    }

    if (stPacket.hash() !== stHeader.extraPayload.hashSTPacket) {
      throw new InvalidArgumentAbciError('stHeader hashSTPacket is not equal to stPacket hash', {
        hashSTPacket: stHeader.extraPayload.hashSTPacket,
        stPacketHash: stPacket.hash(),
      });
    }

    return {
      stHeader,
      stPacket,
    };
  }

  return decodeStateTransition;
}

module.exports = decodeStateTransitionFactory;
