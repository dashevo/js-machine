const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

/**
 *
 * @param {IdentityLevelDBRepository} identityRepository
 * @return {queryHandler}
 */
function queryHandlerFactory(identityRepository) {
  /**
   *
   * Query ABCI handler
   *
   * @typedef queryHandler
   *
   * @param {Object} request
   * @return {Promise<Object>}
   */
  async function queryHandler({ path, data: dataByteArray }) {
    let value;

    switch (path) {
      case '/identity': {
        if (!dataByteArray) {
          throw new InvalidArgumentAbciError('Data is not specified');
        }

        const id = Buffer.from(dataByteArray).toString();

        if (!id) {
          throw new InvalidArgumentAbciError('Id is not specified');
        }

        value = await identityRepository.fetch(id);
        if (value) {
          value = value.serialize();
        }
      }
        break;
      default:
        throw new InvalidArgumentAbciError('Invalid path', { path });
    }

    return {
      code: 0,
      value,
    };
  }

  return queryHandler;
}

module.exports = queryHandlerFactory;
