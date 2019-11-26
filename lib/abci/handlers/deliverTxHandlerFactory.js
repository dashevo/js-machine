const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const AbstractIdentityStateTransition = require('@dashevo/dpp/lib/identity/stateTransitions/AbstractIdentityStateTransition');
const DataContractStateTransition = require('@dashevo/dpp/lib/dataContract/stateTransition/DataContractStateTransition');
const DocumentsStateTransition = require('@dashevo/dpp/lib/document/stateTransition/DocumentsStateTransition');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 * @param {IdentityLevelDBRepository} identityRepository
 *
 * @return {deliverTxHandler}
 */
function deliverTxHandlerFactory(
  dpp,
  driveUpdateStateClient,
  blockchainState,
  identityRepository,
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

    switch (stateTransition.constructor) {
      case AbstractIdentityStateTransition: {
        const currentIdentity = await identityRepository.fetch(
          stateTransition.getIdentityId(),
          true,
        );

        if (currentIdentity) {
          throw new Error('We already have such identity');
        }

        const identity = dpp.identity.applyStateTransition(stateTransition, currentIdentity);
        if (identity) {
          await identityRepository.store(identity);
        }
      }
        break;
      case DataContractStateTransition:
      case DocumentsStateTransition: {
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
        break;
      default:
        throw new InvalidArgumentAbciError('Unknown State Transition');
    }

    return new ResponseDeliverTx();
  }

  return deliverTxHandler;
}

module.exports = deliverTxHandlerFactory;
