const cbor = require('cbor');

class IdentitiesLevelDBRepository {
  /**
   *
   * @param {LevelUP} stateLevelDB
   */
  constructor(stateLevelDB) {
    this.db = stateLevelDB;
  }

  /**
   * Store identity in database
   *
   * @param {IdentityModel} identity
   * @return {Promise<this>}
   */
  async store(identity) {
    await this.db.put(
      this.getKey(identity.getId()),
      cbor.encode(identity.toJSON()),
    );

    return this;
  }

  /**
   * Fetch identity by id from database
   *
   * @param {string} id
   * @return {Promise<null|Buffer>}
   */
  async fetch(id) {
    try {
      return await this.db.get(
        this.getKey(id),
      );
    } catch (e) {
      if (e.type === 'NotFoundError') {
        return null;
      }

      throw e;
    }
  }

  /**
   * Get DB key by identity id
   *
   * @private
   * @param {string} id
   * @return {string}
   */
  getKey(id) {
    return `${IdentitiesLevelDBRepository.KEY_NAME}:${id}`;
  }
}

IdentitiesLevelDBRepository.KEY_NAME = 'identity';

module.exports = IdentitiesLevelDBRepository;
