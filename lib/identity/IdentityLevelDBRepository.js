const cbor = require('cbor');

const InvalidIdentityIdError = require('./errors/InvalidIdentityIdError');

class IdentityLevelDBRepository {
  /**
   *
   * @param {LevelUP} identityLevelDB
   */
  constructor(identityLevelDB) {
    this.db = identityLevelDB;
  }

  /**
   * Store identity in database
   *
   * @param {Identity[]} identities
   * @return {Promise<this>}
   */
  async store(identities) {
    const ops = identities.map(
      identity => ({ type: 'put', key: this.getKey(identity.getId()), value: cbor.encode(identity.toJSON()) }),
    );

    await this.db.batch(ops);

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
    if (typeof id !== 'string') {
      throw new InvalidIdentityIdError(id);
    }

    return `${IdentityLevelDBRepository.KEY_NAME}:${id}`;
  }
}

IdentityLevelDBRepository.KEY_NAME = 'identity';

module.exports = IdentityLevelDBRepository;
