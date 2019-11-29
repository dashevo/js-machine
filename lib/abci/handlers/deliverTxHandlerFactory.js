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

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition/stateTransitionTypes');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

const RateLimiter = require('../../services/RateLimiter');

/**
 * @param {DashPlatformProtocol} dpp
 * @param {UpdateStatePromiseClient} driveUpdateStateClient
 * @param {BlockchainState} blockchainState
 * @param {IdentityLevelDBRepository} identityRepository
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 *
 * @return {deliverTxHandler}
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

    let response = new ResponseDeliverTx();

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
      case stateTransitionTypes.DOCUMENTS: {
        const applyStateTransitionRequest = new ApplyStateTransitionRequest();
        const blockHeight = blockchainState.getLastBlockHeight();
        applyStateTransitionRequest.setBlockHeight(
          blockHeight,
        );

        applyStateTransitionRequest.setBlockHash(
          Buffer.alloc(0),
        );

        applyStateTransitionRequest.setStateTransition(
          stateTransition.serialize(),
        );

        await driveUpdateStateClient.applyStateTransition(applyStateTransitionRequest);

        if (process.env.RATE_LIMITER_ACTIVE) {
          const ResponseDeliverTxWithTag = new ResponseDeliverTx();
          ResponseDeliverTxWithTag.code = 0;
          const limiter = new RateLimiter();
          const rateLimiterKey = limiter.getTagKey(blockHeight);
          const rateLimiterTag = new KVPair(
            { key: rateLimiterKey, value: stateTransition.documents[0].userId },
          );
          ResponseDeliverTxWithTag.tags = [rateLimiterTag];
          response = ResponseDeliverTxWithTag;
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
