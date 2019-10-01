const types = require('abci/types');
const cbor = require('cbor');
const { Transaction } = require('@dashevo/dashcore-lib');

const InvalidArgumentAbciError = require('./errors/InvalidArgumentAbciError');

/**
 * checkTx ABCI handler
 * @param {DashPlatformProtocol} dpp
 * @returns {checkTxHandler}
 */
module.exports = function checkTxHandlerFactory(dpp) {
  /**
   * @typedef checkTxHandler
   * @param request
   * @returns {Promise<abci.ResponseCheckTx>}
   */
  async function checkTxHandler(request) {
    const tx = Buffer.from(request.tx, 'base64');
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
      throw new InvalidArgumentAbciError('stHeader is invalid', e);
    }

    const stPacket = await dpp.packet.createFromSerialized(stPacketBinary);
    if (stPacket.hash() !== stHeader.extraPayload.hashSTPacket) {
      throw new InvalidArgumentAbciError('stHeader hashSTPacket is not equal to stPacket hash', {
        hashSTPacket: stHeader.extraPayload.hashSTPacket,
        stPacketHash: stPacket.hash(),
      });
    }

    if (stHeader.type !== Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION) {
      throw new InvalidArgumentAbciError('stHeader type is invalid');
    }

    // Validate ST Packet
    const validationResult = await dpp.packet.validate(stPacket);

    if (!validationResult.isValid()) {
      throw new InvalidArgumentAbciError('stPacket is invalid', validationResult.getErrors());
    }

    return new types.abci.ResponseCheckTx({ code: 0, log: 'checkTx succeeded' });
  }

  return checkTxHandler;
};
