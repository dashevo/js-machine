const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition//stateTransitionTypes');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');
const RateLimiterQuotaExceededAbciError = require('../errors/RateLimiterQuotaExceededAbciError');
const RateLimiterUserIsBannedAbciError = require('../errors/RateLimiterUserIsBannedAbciError');

/**
 * @param {DashPlatformProtocol} checkTxDpp
 * @param {RateLimiter} rateLimiter
 * @param {boolean} rateLimiterActive
 *
 * @returns {checkTxHandler}
 */
function checkTxHandlerFactory(checkTxDpp, rateLimiter, rateLimiterActive) {
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
      stateTransition = await checkTxDpp
        .stateTransition
        .createFromSerialized(stateTransitionSerialized);
    } catch (e) {
      if (e instanceof InvalidStateTransitionError) {
        throw new InvalidArgumentAbciError('State Transition is invalid', { errors: e.getErrors() });
      }
      throw e;
    }

    // apply rate limiter for document state transitions
    if (rateLimiterActive && stateTransition.getType() === stateTransitionTypes.DOCUMENTS) {
      const { userId } = stateTransition.documents[0];

      const isBannedUser = await rateLimiter.isBannedUser(
        userId, blockchainState.getLastBlockHeight(),
      );

      if (isBannedUser) {
        throw new RateLimiterUserIsBannedAbciError(userId);
      }

      const isQuotaExceeded = await rateLimiter.isQuotaExceeded(
        userId, blockchainState.getLastBlockHeight(),
      );

      if (isQuotaExceeded) {
        const banKey = rateLimiter.getBannedKey(blockchainState.getLastBlockHeight());

        throw new RateLimiterQuotaExceededAbciError(userId, {
          [banKey]: userId,
          bannedUserIds: userId,
        });
      }
    }

    return new ResponseCheckTx();
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
