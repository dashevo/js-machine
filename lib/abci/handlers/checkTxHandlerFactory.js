const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');


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
   * @returns {Promise<abci.ResponseCheckTx>}
   */
  async function checkTxHandler(request) {
    const { tx } = request;

    if (!tx) {
      throw new InvalidArgumentAbciError('stateTransition is not specified');
    }

    try {
      await dpp.stateTransition.createFromSerialized(Buffer.from(tx));
    } catch (e) {
      if (e instanceof InvalidStateTransitionError) {
        throw new InvalidArgumentAbciError('stateTransition is invalid', { errors: e.getErrors() });
      }

      throw e;
    }

    return new ResponseCheckTx();
  }

  return checkTxHandler;
}

module.exports = checkTxHandlerFactory;
