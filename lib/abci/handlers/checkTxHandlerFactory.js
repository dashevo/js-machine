const {
  abci: {
    ResponseCheckTx,
    KVPair,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

const rateLimiter = require('../services/rateLimiter');

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

    // check rate limiter
    if (rateLimiter.quotaExceeded(stateTransition.$userId, blockchainState.getLastBlockHeight())) {
      const quotaExceededResponse = new ResponseCheckTx();
      quotaExceededResponse.code = 1;
      quotaExceededResponse.log = 'state transition quota exceeded';
      quotaExceededResponse.info = 'state transition quota exceeded';
      quotaExceededResponse.data = stateTransitionByteArray;
      const idTag = new KVPair({ key: 'rateLimitedUserIds', value: stateTransition.$userId });
      const dataTag = new KVPair({ key: 'rateLimitedTransition', value: stateTransitionByteArray });
      quotaExceededResponse.tags = [idTag, dataTag];
      return quotaExceededResponse;
    }
    return new ResponseCheckTx();
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
