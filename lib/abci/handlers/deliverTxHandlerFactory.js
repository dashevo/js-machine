const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

/**
 * @param {decodeStateTransition} decodeStateTransition
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 *
 * @returns {deliverTxHandler}
 */
function deliverTxHandlerFactory(decodeStateTransition, driveUpdateStateClient, blockchainState) {
  /**
   * DeliverTx ABCI handler
   *
   * @typedef deliverTxHandler
   *
   * @param {abci.RequestDeliverTx} request
   * @returns {Promise<abci.ResponseDeliverTx>}
   */
  async function deliverTxHandler(request) {
    const stateTransition = await decodeStateTransition(request.tx);

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
