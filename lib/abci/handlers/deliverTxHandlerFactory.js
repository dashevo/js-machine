const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const {
  abci: {
    ResponseDeliverTx,
  },
  common: {
    KVPair,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

const RateLimiter = require('../../services/RateLimiter');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 *
 * @returns {deliverTxHandler}
 */
function deliverTxHandlerFactory(dpp, driveUpdateStateClient, blockchainState) {
  /**
   * DeliverTx ABCI handler
   *
   * @typedef deliverTxHandler
   *
   * @param {abci.RequestDeliverTx} request
   * @returns {Promise<abci.ResponseDeliverTx>}
   */
  async function deliverTxHandler({ tx: stateTransitionByteArray }) {
    if (!stateTransitionByteArray) {
      throw new InvalidArgumentAbciError('State Transition is not specified');
    }

    const stateTransitionSerialized = Buffer.from(stateTransitionByteArray);

    let stateTransition;
    try {
      stateTransition = await dpp
        .stateTransition
        .createFromSerialized(stateTransitionSerialized);
    } catch (e) {
      if (e instanceof InvalidStateTransitionError) {
        throw new InvalidArgumentAbciError('State Transition is invalid', { errors: e.getErrors() });
      }

      throw e;
    }

    const blockHeight = blockchainState.getLastBlockHeight();

    const applyStateTransitionRequest = new ApplyStateTransitionRequest();

    applyStateTransitionRequest.setBlockHeight(
      blockHeight,
    );

    applyStateTransitionRequest.setBlockHash(
      Buffer.alloc(0),
    );

    applyStateTransitionRequest.setStateTransition(
      stateTransition.serialize(),
    );

    await driveUpdateStateClient.applyStateTransition(applyStateTransitionRequest);

    const ResponseDeliverTxSuccess = new ResponseDeliverTx();
    ResponseDeliverTxSuccess.code = 0;
    const limiter = new RateLimiter();
    const rateLimiterKey = limiter.getTagKey(blockHeight);
    const rateLimiterTag = new KVPair({ key: rateLimiterKey, value: stateTransition.$userId });
    ResponseDeliverTxSuccess.tags = [rateLimiterTag];

    return ResponseDeliverTxSuccess;
  }

  return deliverTxHandler;
}

module.exports = deliverTxHandlerFactory;
