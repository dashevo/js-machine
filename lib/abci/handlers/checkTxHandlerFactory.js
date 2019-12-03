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

const AbciError = require('../errors/AbciError');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {RateLimiter} rateLimiter
 * @param {boolean} rateLimiterActive
 *
 * @returns {checkTxHandler}
 */
function checkTxHandlerFactory(dpp, rateLimiter, rateLimiterActive) {
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

    // apply rate limiter for document state transitions
    if (rateLimiterActive && stateTransition.getType() === stateTransitionTypes.DOCUMENTS) {
      const { userId } = stateTransition.documents[0];

      const isBannedUser = await rateLimiter.isBannedUser(
        userId, blockchainState.getLastBlockHeight(),
      );

      if (isBannedUser) {
        const bannedResponse = new ResponseCheckTx();

        bannedResponse.code = AbciError.CODES.RATE_LIMITER_BANNED;
        bannedResponse.log = `Identity ${userId} is banned for some time`;
        bannedResponse.info = 'Identity has been banned for some time';

        return bannedResponse;
      }

      const isQuotaExceeded = await rateLimiter.isQuotaExceeded(
        userId, blockchainState.getLastBlockHeight(),
      );

      if (isQuotaExceeded) {
        const quotaExceededResponse = new ResponseCheckTx();

        quotaExceededResponse.code = AbciError.CODES.RATE_LIMITER_QUOTA_EXCEEDED;
        quotaExceededResponse.log = `state transition quota exceeded for identity ${userId}`;
        quotaExceededResponse.info = 'state transition quota exceeded';
        quotaExceededResponse.data = stateTransitionByteArray;

        const banKey = rateLimiter.getBannedKey(blockchainState.getLastBlockHeight());
        const temporarilyBannedUser = new KVPair({ key: banKey, value: userId });
        const globalBansForStatistics = new KVPair({ key: 'bannedUserIds', value: userId });

        quotaExceededResponse.tags = [temporarilyBannedUser, globalBansForStatistics];

        return quotaExceededResponse;
      }
    }

    return new ResponseCheckTx();
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
