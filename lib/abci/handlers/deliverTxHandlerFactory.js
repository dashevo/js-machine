const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition/stateTransitionTypes');
const IdentityModel = require('@dashevo/dpp/lib/identity/model/IdentityModel');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 * @param {IdentityState} identityState
 *
 * @return {deliverTxHandler}
 */
module.exports = function deliverTxHandlerFactory(
  dpp,
  driveUpdateStateClient,
  blockchainState,
  identityState,
) {
  /**
   * DeliverTx ABCI handler
   *
   * @typedef deliverTxHandler
   *
   * @param {abci.RequestDeliverTx} request
   * @return {Promise<abci.ResponseDeliverTx>}
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

    const stType = stateTransition.getType();
    if (stType === stateTransitionTypes.IDENTITY_CREATE) {
      const identityModel = new IdentityModel();
      identityModel.applyStateTransition(stateTransition);

      identityState.setIdentityModel(identityModel);
    } else {
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
    }

    return new ResponseDeliverTx();
  }

  return deliverTxHandler;
};
