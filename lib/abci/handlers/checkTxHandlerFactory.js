const {
  abci: {
    ResponseCheckTx,
  },
  common: {
    KVPair,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition//stateTransitionTypes');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

const RateLimiter = require('../../services/RateLimiter');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {TendermintRPCClient} tendermintRPC
 * @returns {checkTxHandler}
 */
function checkTxHandlerFactory(dpp, tendermintRPC) {
  /**
   * CheckTx ABCI handler
   *
   * @typedef checkTxHandler
   *
   * @param {abci.RequestCheckTx} request
   * @param {BlockchainState} blockchainState
   * @returns {Promise<abci.ResponseCheckTx>}
   */
  async function checkTxHandler({ tx: stateTransitionByteArray }, blockchainState) {
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

    let response = new ResponseCheckTx();

    switch (stateTransition.getType()) {
      case stateTransitionTypes.IDENTITY_CREATE:
      case stateTransitionTypes.DATA_CONTRACT:
      case stateTransitionTypes.DOCUMENTS: {
        if (process.env.RATE_LIMITER_ACTIVE) {
          const { userId } = stateTransition.documents[0].userId;
          const limiter = new RateLimiter({ tendermintRPC });
          if (await limiter.isQuotaExceeded(
            userId, blockchainState.getLastBlockHeight(),
          )) {
            const quotaExceededResponse = new ResponseCheckTx();
            quotaExceededResponse.code = 1;
            quotaExceededResponse.log = `state transition quota exceeded for identity ${userId}`;
            quotaExceededResponse.info = 'state transition quota exceeded';
            quotaExceededResponse.data = stateTransitionByteArray;
            const limitedId = new KVPair({ key: 'rateLimitedUserIds', value: userId });
            const limitedST = new KVPair({ key: 'rateLimitedTransitions', value: stateTransitionByteArray });
            quotaExceededResponse.tags = [limitedId, limitedST];
            response = quotaExceededResponse;
          }
        }
        break;
      }
      default:
        throw new InvalidArgumentAbciError('Unknown State Transition');
    }

    return response;
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
