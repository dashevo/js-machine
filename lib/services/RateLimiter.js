const TendermintRpc = require('../api/TendermintRPCClient');

class RateLimiter {
  constructor() {
    this.rpcClient = new TendermintRpc();
    this.perBlockInterval = process.env.RATE_LIMITER_PER_BLOCK_INTERVAL;
    this.maxPerId = process.env.RATE_LIMITER_MAX_TRANSITIONS_PER_ID;
    this.rateLimiterIntervalPrefix = process.env.RATE_LIMITER_INTERVAL_PREFIX;
  }

  /**
   * checks if transition quota per identity is exceeded
   * @param {string} userId
   * @param {number} blockHeight
   * @return {Promise<boolean>}
   */
  async isQuotaExceeded(userId, blockHeight) {
    const tagKey = this.getTagKey(blockHeight);
    const match = await this.rpcClient.fetchTransitionsByTag(tagKey, userId, true);
    return match.totalCount > this.maxPerId;
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
