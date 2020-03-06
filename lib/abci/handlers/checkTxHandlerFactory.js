const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition/stateTransitionTypes');

const RateLimiterQuotaExceededAbciError = require('../errors/RateLimiterQuotaExceededAbciError');
const RateLimiterUserIsBannedAbciError = require('../errors/RateLimiterUserIsBannedAbciError');

/**
 * @param {unserializeStateTransition} unserializeStateTransition
 * @param {BlockchainState} blockchainState
 * @param {RateLimiter} rateLimiter
 * @param {boolean} rateLimiterActive
 *
 * @returns {checkTxHandler}
 */
function checkTxHandlerFactory(
  unserializeStateTransition,
  blockchainState,
  rateLimiter,
  rateLimiterActive,
) {
  /**
   * CheckTx ABCI handler
   *
   * @typedef checkTxHandler
   *
   * @param {abci.RequestCheckTx} request
   *
   * @returns {Promise<abci.ResponseCheckTx>}
   */
  async function checkTxHandler({ tx: stateTransitionByteArray }) {
    const stateTransition = await unserializeStateTransition(stateTransitionByteArray);

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
