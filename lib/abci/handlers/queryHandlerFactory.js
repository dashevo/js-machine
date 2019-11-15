const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 *
 * @param {IdentityLevelDBRepository} identityRepository
 * @return {queryHandler}
 */
module.exports = function queryHandlerFactory(identityRepository) {
  /**
   *
   * Query ABCI handler
   *
   * @typedef queryHandler
   *
   * @param {Object} request
   * @return {Promise<Object>}
   */
  async function queryHandler({ path, data }) {
    let value;

    if (path === '/identity') {
      if (!data) {
        throw new InvalidArgumentAbciError('Data is not specified');
      }

      const id = Buffer.from(data).toString();
      value = await identityRepository.fetch(id);
    } else {
      throw new InvalidArgumentAbciError('Invalid path', { path });
    }

    return {
      code: 0,
      value,
    };
  }

  return queryHandler;
};
