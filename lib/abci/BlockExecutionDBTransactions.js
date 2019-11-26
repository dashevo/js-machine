class BlockExecutionDBTransactions {
  constructor() {
    this.transactions = {
      identityTransaction: null,
    };
  }

  /**
   * Set identity DB transaction
   *
   * @param {LevelDBTransaction} transaction
   * @return {BlockExecutionDBTransactions}
   */
  setIdentityTransaction(transaction) {
    this.transactions = {
      ...this.transactions,
      identityTransaction: transaction,
    };

    return this;
  }

  /**
   * Get identity DB transaction
   *
   * @return {LevelDBTransaction}
   */
  getIdentityTransaction() {
    return this.transactions.identityTransaction;
  }

  /**
   * Commit all transactions
   *
   * @return {Promise<Transaction>}
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
