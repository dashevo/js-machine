class BlockchainState {
  /**
   *
   * @param {number=0} lastBlockHeight
   * @param {Buffer} lastBlockAppHash
   */
  constructor(lastBlockHeight = 0, lastBlockAppHash = Buffer.alloc(0)) {
    this.lastBlockHeight = lastBlockHeight;
    this.lastBlockAppHash = lastBlockAppHash;
  }

  /**
   * Get last block height
   *
   * @return {number}
   */
  getLastBlockHeight() {
    return this.lastBlockHeight;
  }

  /**
   * Set last block height
   *
   * @param {number} blockHeight
   * @return {BlockchainState}
   */
  setLastBlockHeight(blockHeight) {
    this.lastBlockHeight = blockHeight;

    return this;
  }

  /**
   * Get last block app hash
   *
   * @return {Buffer}
   */
  getLastBlockAppHash() {
    return this.lastBlockAppHash;
  }

  /**
   * Set last block app hash
   *
   * @param {Buffer} appHash
   * @return {BlockchainState}
   */
  setLastBlockAppHash(appHash) {
    this.lastBlockAppHash = appHash;

    return this;
  }

  /**
   * Get plain JS object
   *
   * @return {{lastBlockHeight: number}}
   */
  toJSON() {
    return {
      lastBlockHeight: this.lastBlockHeight,
      lastBlockAppHash: this.lastBlockAppHash,
    };
  }
}

module.exports = BlockchainState;
