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

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition/stateTransitionTypes');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');
const RateLimiterQuotaExceededAbciError = require('../errors/RateLimiterQuotaExceededAbciError');
const RateLimiterUserIsBannedAbciError = require('../errors/RateLimiterUserIsBannedAbciError');

/**
 * @param {unserializeStateTransition} unserializeStateTransition
 * @param {DashPlatformProtocol} deliverTxDpp
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
  unserializeStateTransition,
  deliverTxDpp,
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
    const stateTransition = await unserializeStateTransition(stateTransitionByteArray);

    const response = new ResponseDeliverTx();
    const applyStateTransitionRequest = new ApplyStateTransitionRequest();

    switch (stateTransition.getType()) {
      case stateTransitionTypes.IDENTITY_CREATE: {
        const result = await deliverTxDpp.stateTransition.validateData(stateTransition);
        if (!result.isValid()) {
          throw new InvalidArgumentAbciError('Invalid Identity Create Transition', { errors: result.getErrors() });
        }

        const identityDBTransaction = blockExecutionDBTransactions.getIdentityTransaction();

        const currentIdentity = await identityRepository.fetch(
          stateTransition.getIdentityId(),
          identityDBTransaction,
        );

        const identity = deliverTxDpp.identity.applyStateTransition(
          stateTransition,
          currentIdentity,
        );
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

          // tag response to keep track of rate limiting events
          const rateLimiterKey = rateLimiter.getRateLimitedKey(
            blockchainState.getLastBlockHeight(),
          );

          const rateLimiterEventTag = new KVPair(
            { key: rateLimiterKey, value: userId },
          );

          response.tags = [rateLimiterEventTag];
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
