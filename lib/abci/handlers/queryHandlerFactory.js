const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition/stateTransitionTypes');

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 *
 * @param {IdentitiesLevelDBRepository} identitiesRepository
 * @return {queryHandler}
 */
module.exports = function queryHandlerFactory(identitiesRepository) {
  /**
   *
   * Query ABCI handler
   *
   * @typedef queryHandler
   *
   * @param {Object} request
   * @return {Promise<Object>}
   */
  async function queryHandler(request) {
    const { type, id } = request;

    const result = {};

    switch (type) {
      case stateTransitionTypes.IDENTITY_CREATE:
        result.data = await identitiesRepository.fetch(id);
        break;
      default:
        throw new InvalidArgumentAbciError('Invalid State Transition type', { type });
    }

    return result;
  }

  return queryHandler;
};
