class BlockExecutionDBTransactions {
  constructor() {
    this.transactions = {
      identity: null,
    };
  }

  /**
   * Set identity DB transaction
   *
   * @param {LevelDBTransaction} transaction
   * @return {BlockExecutionDBTransactions}
   */
  setIdentityTransaction(transaction) {
    this.transactions.identity = transaction;

    return this;
  }

  /**
   * Get identity DB transaction
   *
   * @return {LevelDBTransaction}
   */
  getIdentityTransaction() {
    return this.transactions.identity;
  }

  /**
   * Commit all transactions
   *
   * @return {Promise<[void]>}
   */
  async commit() {
    return Promise.all(
      Object
        .values(this.transactions)
        .map(transaction => transaction.db.commit()),
    );
  }
}

module.exports = BlockExecutionDBTransactions;
