const types = require('abci/types');
const cbor = require('cbor');
const { Transaction } = require('@dashevo/dashcore-lib');

const ZERO_HASH = '00'.repeat(32);

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
    // @TODO check tx type here
    // if (isStateViewTransition(request.tx)) {
    //
    // }

    // @TODO fix this
    const tx = Buffer.from(request.tx, 'base64');
    const deserialized = cbor.decode(tx);


    // const tx = Buffer.from(request.tx, 'base64').toString('binary');
    const { header: stHeaderBinary, packet: stPacketBinary} = deserialized;

    let code = 0;
    let log = '';

    // Validate ST Header

    if (stHeader.type !== Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION) {
      // invalid transaction type
    }

    let stHeader;

    try {
      stHeader = new Transaction(stHeaderBinary);
    } catch (e) {
    }


    // Validate ST Packet
    const isStPacketValid = await dpp.packet.validate(stPacketBinary);

    if (!isStPacketValid) {
      code = 1;
      log = JSON.stringify({
        message: 'stPacket is not valid',
        data: '',
      });
    }

    return new types.abci.ResponseCheckTx({ code, log });
  }

  return checkTxHandler;
};
