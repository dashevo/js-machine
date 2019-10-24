const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

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
  async function deliverTxHandler(request) {
    const { tx: stateTransitionByteArray } = request;

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

    const applyStateTransitionRequest = new ApplyStateTransitionRequest();

    applyStateTransitionRequest.setBlockHeight(
      blockchainState.getLastBlockHeight(),
    );

    applyStateTransitionRequest.setBlockHash(
      Buffer.alloc(0),
    );

    applyStateTransitionRequest.setStateTransition(
      stateTransition.serialize(),
    );

    await driveUpdateStateClient.applyStateTransition(applyStateTransitionRequest);

    return new ResponseDeliverTx();
  }

  return deliverTxHandler;
}

module.exports = deliverTxHandlerFactory;
