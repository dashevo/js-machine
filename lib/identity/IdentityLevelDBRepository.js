const util = require('util');
const levelDBTransaction = require('level-transactions');

const InvalidIdentityIdError = require('./errors/InvalidIdentityIdError');
const LevelDBTransactionIsNotStartedError = require('./errors/LevelDBTransactionIsNotStartedError');
const LevelDBTransactionIsAlreadyStartedError = require('./errors/LevelDBTransactionIsAlreadyStartedError');

class IdentityLevelDBRepository {
  /**
   *
   * @param {LevelUP} identityLevelDB
   * @param {DashPlatformProtocol} dpp
   */
  constructor(identityLevelDB, dpp) {
    this.db = identityLevelDB;
    this.dpp = dpp;
    this.dbTransaction = null;
  }

  /**
   * Start new transaction in level DB
   *
   * @return {IdentityLevelDBRepository}
   */
  startTransaction() {
    if (this.dbTransaction) {
      throw new LevelDBTransactionIsAlreadyStartedError();
    }

    this.dbTransaction = levelDBTransaction(this.db);
    this.dbTransaction.commitAsync = util.promisify(this.dbTransaction.commit);
    this.dbTransaction.putAsync = util.promisify(this.dbTransaction.put);
    this.dbTransaction.getAsync = util.promisify(this.dbTransaction.get);

    return this;
  }

  /**
   * Commit transaction to level DB
   *
   * @return {Promise<IdentityLevelDBRepository>}
   */
  async commit() {
    if (!this.dbTransaction) {
      throw new LevelDBTransactionIsNotStartedError();
    }

    await this.dbTransaction.commitAsync();

    this.dbTransaction = null;

    return this;
  }

  /**
   * Store identity into database
   *
   * @param {Identity} identity
   * @return {Promise<IdentityLevelDBRepository>}
   */
  async store(identity) {
    if (!this.dbTransaction) {
      throw new LevelDBTransactionIsNotStartedError();
    }

    await this.dbTransaction.putAsync(
      this.getKey(identity.getId()),
      identity.serialize(),
      { asBuffer: true },
    );

    return this;
  }

  /**
   * Fetch identity by id from database
   *
   * @param {string} id
   * @param {boolean} useTransaction
   * @return {Promise<null|Identity>}
   */
  async fetch(id, useTransaction = false) {
    if (useTransaction && !this.dbTransaction) {
      throw new LevelDBTransactionIsNotStartedError();
    }

    let encodedIdentity;

    try {
      if (useTransaction) {
        encodedIdentity = await this.dbTransaction.getAsync(
          this.getKey(id),
        );
      } else {
        encodedIdentity = await this.db.get(
          this.getKey(id),
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
  getKey(id) {
    if (typeof id !== 'string') {
      throw new InvalidIdentityIdError(id);
    }

    return `${IdentityLevelDBRepository.KEY_NAME}:${id}`;
  }
}

IdentityLevelDBRepository.KEY_NAME = 'identity';

module.exports = IdentityLevelDBRepository;
