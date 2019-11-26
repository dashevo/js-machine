const LevelDbTransaction = require('../levelDb/LevelDBTransaction');

const InvalidIdentityIdError = require('./errors/InvalidIdentityIdError');

class IdentityLevelDBRepository {
  /**
   *
   * @param {LevelUP} identityLevelDB
   * @param {DashPlatformProtocol} identityDpp
   */
  constructor(identityLevelDB, identityDpp) {
    this.db = identityLevelDB;
    this.dpp = identityDpp;
  }

  /**
   * Store identity into database
   *
   * @param {Identity} identity
   * @param {LevelDBTransaction} [transaction]
   * @return {Promise<IdentityLevelDBRepository>}
   */
  async store(identity, transaction = undefined) {
    if (transaction) {
      transaction.db.put(
        this.addKeyPrefix(identity.getId()),
        identity.serialize(),
        { asBuffer: true },
      );
    } else {
      await this.db.put(
        this.addKeyPrefix(identity.getId()),
        identity.serialize(),
      );
    }

    return this;
  }

  /**
   * Fetch identity by id from database
   *
   * @param {string} id
   * @param {LevelDBTransaction} [transaction]
   * @return {Promise<null|Identity>}
   */
  async fetch(id, transaction = undefined) {
    let encodedIdentity;

    try {
      if (transaction) {
        encodedIdentity = await transaction.db.get(
          this.addKeyPrefix(id),
        );
      } else {
        encodedIdentity = await this.db.get(
          this.addKeyPrefix(id),
        );
      }

      return this.dpp.identity.createFromSerialized(encodedIdentity);
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
  addKeyPrefix(id) {
    if (typeof id !== 'string') {
      throw new InvalidIdentityIdError(id);
    }

    return `${IdentityLevelDBRepository.KEY_NAME}:${id}`;
  }

  /**
   * Creates new transaction instance
   *
   * @return {LevelDBTransaction}
   */
  createTransaction() {
    return new LevelDbTransaction(this.db);
  }
}

IdentityLevelDBRepository.KEY_NAME = 'identity';

module.exports = IdentityLevelDBRepository;
