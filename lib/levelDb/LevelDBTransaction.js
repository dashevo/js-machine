const { promisify } = require('util');

const levelDBTransaction = require('level-transactions');

const LevelDBTransactionIsNotStartedError = require('./errors/LevelDBTransactionIsNotStartedError');
const LevelDBTransactionIsAlreadyStartedError = require('./errors/LevelDBTransactionIsAlreadyStartedError');

class LevelDBTransaction {
  /**
   * @param {LevelUP} identityLevelDB
   * @param identityLevelDB
   */
  constructor(identityLevelDB) {
    this.identityLevelDB = identityLevelDB;
    this.db = null;
  }

  /**
   * Start new transaction in level DB
   *
   * @returns {LevelDBTransaction}
   */
  startTransaction() {
    if (this.db) {
      throw new LevelDBTransactionIsAlreadyStartedError();
    }

    this.db = levelDBTransaction(this.identityLevelDB);

    // promisify methods
    this.db.commit = promisify(this.db.commit.bind(this.db));
    this.db.get = promisify(this.db.get.bind(this.db));
    this.db.put = promisify(this.db.put.bind(this.db));

    return this;
  }

  /**
   * Commit transaction to level DB
   *
   * @returns {Promise<LevelDBTransaction>}
   */
  async commit() {
    if (!this.db) {
      throw new LevelDBTransactionIsNotStartedError();
    }

    await this.db.commit();

    this.db = null;

    return this;
  }
}

module.exports = LevelDBTransaction;
