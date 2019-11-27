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

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 * @param {IdentityLevelDBRepository} identityRepository
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 *
 * @returns {deliverTxHandler}
 */
function deliverTxHandlerFactory(
  dpp,
  driveUpdateStateClient,
  blockchainState,
  identityRepository,
  blockExecutionDBTransactions,
) {
  /**
   * DeliverTx ABCI handler
   *
   * @typedef deliverTxHandler
   *
   * @param {abci.RequestDeliverTx} request
   * @returns {Promise<abci.ResponseDeliverTx>}
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

    switch (stateTransition.getType()) {
      case stateTransitionTypes.IDENTITY_CREATE: {
        const result = await dpp.stateTransition.validateData(stateTransition);
        if (!result.isValid()) {
          throw new InvalidArgumentAbciError('Invalid Identity Create Transition', { errors: result.getErrors() });
        }

        const identityDBTransaction = blockExecutionDBTransactions.getIdentityTransaction();

        const currentIdentity = await identityRepository.fetch(
          stateTransition.getIdentityId(),
          identityDBTransaction,
        );

        const identity = dpp.identity.applyStateTransition(stateTransition, currentIdentity);
        if (identity) {
          await identityRepository.store(identity, identityDBTransaction);
        }
      }
        break;
      case stateTransitionTypes.DATA_CONTRACT:
      case stateTransitionTypes.DOCUMENTS: {
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
