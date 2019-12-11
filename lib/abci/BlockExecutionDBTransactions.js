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
   * @return {Promise<[LevelDBTransaction]>}
   */
  async commit() {
    return Promise.all(
      Object
        .values(this.transactions)
        .map(transaction => transaction.commit()),
    );
  }
}

module.exports = BlockExecutionDBTransactions;
