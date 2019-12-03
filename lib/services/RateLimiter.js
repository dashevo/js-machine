class RateLimiter {
  /**
   * @param {fetchTransitionCountByEvent} fetchTransitionCountByEvent
   * @param {number} options.rateLimiterInterval
   * @param {number} options.rateLimiterMax
   * @param {string} options.rateLimiterPrefix
   * @param {number} options.rateLimiterBanPrefix
   * @param {string} options.rateLimiterBanInterval
   */
  constructor(fetchTransitionCountByEvent, options) {
    this.fetchTransitionCountByEvent = fetchTransitionCountByEvent;

    this.perBlockInterval = options.rateLimiterInterval;
    this.maxPerId = options.rateLimiterMax;
    this.rateLimiterIntervalPrefix = options.rateLimiterPrefix;
    this.rateLimiterBanPrefix = options.rateLimiterBanPrefix;
    this.rateLimiterBanInterval = options.rateLimiterBanInterval;
  }

  /**
   * checks if transition quota per identity is exceeded
   * @param {string} userId
   * @param {number} blockHeight
   * @return {Promise<boolean>}
   */
  async isQuotaExceeded(userId, blockHeight) {
    const limitedKey = this.getRateLimitedKey(blockHeight);
    const count = await this.fetchTransitionCountByEvent(limitedKey, userId);
    return count > this.maxPerId;
  }

  /**
   * checks if transition quota per identity is exceeded
   * @param {string} userId
   * @param {number} blockHeight
   * @return {Promise<boolean>}
   */
  async isBannedUser(userId, blockHeight) {
    const bannedKey = this.getBannedKey(blockHeight);
    const count = await this.fetchTransitionCountByEvent(bannedKey, userId);
    return count > 0;
  }

  /**
   * gets the key for the rate limited event
   * @param {number} blockHeight
   * @return {string}
   */
  getRateLimitedKey(blockHeight) {
    const rateLimiterIntervalPeriod = Math.floor(blockHeight / this.perBlockInterval);
    return `${this.rateLimiterIntervalPrefix}.${rateLimiterIntervalPeriod}`;
  }

  /**
   * gets the key for the banned event
   * @param {number} blockHeight
   * @return {string}
   */
  getBannedKey(blockHeight) {
    const rateLimiterBanPeriod = Math.floor(blockHeight / this.rateLimiterBanInterval);
    return `${this.rateLimiterBanPrefix}.${rateLimiterBanPeriod}`;
  }
}

module.exports = RateLimiter;
