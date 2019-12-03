const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const {
  abci: {
    ResponseDeliverTx,
  },
  common: {
    KVPair,
  },
} = require('abci/types');

const GrpcError = require('@dashevo/grpc-common/lib/server/error/GrpcError');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition/stateTransitionTypes');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 * @param {IdentityLevelDBRepository} identityRepository
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 * @param {RateLimiter} rateLimiter
 * @param {boolean} rateLimiterActive
 *
 * @return {deliverTxHandler}
 */
function deliverTxHandlerFactory(
  dpp,
  driveUpdateStateClient,
  blockchainState,
  identityRepository,
  blockExecutionDBTransactions,
  rateLimiter,
  rateLimiterActive,
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

    const response = new ResponseDeliverTx();
    const applyStateTransitionRequest = new ApplyStateTransitionRequest();

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

        break;
      }
      case stateTransitionTypes.DATA_CONTRACT:
        applyStateTransitionRequest.setBlockHeight(
          blockchainState.getLastBlockHeight(),
        );

        applyStateTransitionRequest.setBlockHash(
          Buffer.alloc(0),
        );

        applyStateTransitionRequest.setStateTransition(
          stateTransition.serialize(),
        );

        try {
          await driveUpdateStateClient.applyStateTransition(applyStateTransitionRequest);
        } catch (e) {
          if (e.code === GrpcError.CODES.INVALID_ARGUMENT) {
            throw new InvalidArgumentAbciError(e.message, e.metadata.getMap());
          }

          throw e;
        }
        break;
      case stateTransitionTypes.DOCUMENTS: {
        applyStateTransitionRequest.setBlockHeight(
          blockchainState.getLastBlockHeight(),
        );

        applyStateTransitionRequest.setBlockHash(
          Buffer.alloc(0),
        );

        applyStateTransitionRequest.setStateTransition(
          stateTransition.serialize(),
        );

        try {
          await driveUpdateStateClient.applyStateTransition(applyStateTransitionRequest);
        } catch (e) {
          if (e.code === GrpcError.CODES.INVALID_ARGUMENT) {
            throw new InvalidArgumentAbciError(e.message, e.metadata.getMap());
          }

          throw e;
        }

        if (rateLimiterActive) {
          const rateLimiterKey = rateLimiter.getRateLimitedKey(
            blockchainState.getLastBlockHeight(),
          );

          const rateLimiterEvent = new KVPair(
            { key: rateLimiterKey, value: stateTransition.documents[0].userId },
          );

          response.tags = [rateLimiterEvent];
        }

        break;
      }
      default:
        throw new InvalidArgumentAbciError('Unknown State Transition');
    }

    return response;
  }

  return deliverTxHandler;
}

module.exports = deliverTxHandlerFactory;
