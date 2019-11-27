const {
  abci: {
    KVPair,
    ResponseCheckTx,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

const RateLimiter = require('../../services/RateLimiter');

/**
 * @param {DashPlatformProtocol} dpp
 * @returns {checkTxHandler}
 */
function checkTxHandlerFactory(dpp) {
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

    const limiter = new RateLimiter();
    if (limiter.isQuotaExceeded(stateTransition.$userId, blockchainState.getLastBlockHeight())) {
      const quotaExceededResponse = new ResponseCheckTx();
      quotaExceededResponse.code = 1;
      quotaExceededResponse.log = 'state transition quota exceeded';
      quotaExceededResponse.info = 'state transition quota exceeded';
      quotaExceededResponse.data = stateTransitionByteArray;
      const limitedId = new KVPair({ key: 'rateLimitedUserIds', value: stateTransition.$userId });
      const limitedST = new KVPair({ key: 'rateLimitedTransitions', value: stateTransitionByteArray });
      quotaExceededResponse.tags = [limitedId, limitedST];
      return quotaExceededResponse;
    }
    return new ResponseCheckTx();
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
