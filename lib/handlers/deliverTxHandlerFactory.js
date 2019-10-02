const cbor = require('cbor');
const { Transaction } = require('@dashevo/dashcore-lib');
const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');
const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const InvalidArgumentAbciError = require('./errors/InvalidArgumentAbciError');

/**
 * deliverTx ABCI handler
 * @param {DashPlatformProtocol} dpp
 * @param {AppState} state
 * @param {UpdateStatePromiseClient} updateStateClient
 * @returns {deliverTxHandler}
 */
module.exports = function deliverTxHandlerFactory(dpp, state, updateStateClient) {
  /**
   * @typedef deliverTxHandler
   * @param request
   * @returns {Promise<abci.ResponseDeliverTx>}
   */
  async function deliverTxHandler(request) {
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

    const verificationResult = await dpp.packet.verify(stPacket, stHeader);

    if (!verificationResult.isValid()) {
      throw new InvalidArgumentAbciError('stPacket is invalid', verificationResult.getErrors());
    }

    const applyStateTransitionRequest = new ApplyStateTransitionRequest();
    applyStateTransitionRequest.setBlockHeight(state.getHeight());
    applyStateTransitionRequest.setBlockHash(state.getBlockHash());
    applyStateTransitionRequest.setStateTransitionPacket(stPacket.serialize());
    applyStateTransitionRequest.setStateTransitionHeader(Buffer.from(stHeader.serialize(), 'hex'));

    await updateStateClient.applyStateTransition(applyStateTransitionRequest);

    return new ResponseDeliverTx({ code: 0, log: 'deliverTx succeeded' });
  }

  return deliverTxHandler;
};
