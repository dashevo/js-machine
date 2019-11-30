class RateLimiter {
  /**
   *
   * @param {TendermintRPCClient} options.tendermintRPC
   * @param {number} options.rateLimiterInterval
   * @param {number} options.rateLimiterMax
   * @param {string} options.rateLimiterPrefix
   */
  constructor(options) {
    this.tendermintRPC = options.tendermintRPC;
    this.perBlockInterval = options.rateLimiterInterval;
    this.maxPerId = options.rateLimiterMax;
    this.rateLimiterIntervalPrefix = options.rateLimiterPrefix;
  }

  /**
   * checks if transition quota per identity is exceeded
   * @param {string} userId
   * @param {number} blockHeight
   * @return {Promise<boolean>}
   */
  async isQuotaExceeded(userId, blockHeight) {
    const tagKey = this.getTagKey(blockHeight);
    const match = await this.tendermintRPC.fetchTransitionsByTag(tagKey, userId, true);
    return parseInt(match.total_count, 10) > this.maxPerId;
  }

  /**
   * gets the tag key
   * @param {number} blockHeight
   * @return {string}
   */
  getTagKey(blockHeight) {
    const rateLimiterInterval = Math.floor(blockHeight / this.perBlockInterval);
    const prefix = this.rateLimiterIntervalPrefix;
    return `${prefix}.${rateLimiterInterval}`;
  }
}

module.exports = RateLimiter;
