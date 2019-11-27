const TendermintRpc = require('../api/TendermintRPCClient');

class RateLimiter {
  constructor() {
    this.rpcClient = new TendermintRpc();
    this.perBlockInterval = process.env.RATE_LIMITER_PER_BLOCK_INTERVAL;
    this.maxPerId = process.env.RATE_LIMITER_MAX_TRANSITIONS_PER_ID;
  }

  /**
   * checks if transition quota
   * per identity is exceeded
   * @param {string} userId
   * @param {number} blockHeight
   * @return {Promise<boolean>}
   */
  async isQuotaExceeded(userId, blockHeight) {
    const rateLimiterInterval = Math.floor(blockHeight / this.perBlockInterval);
    const tag = `${userId}_${rateLimiterInterval}`;
    const transitions = await this.rpcClient.fetchTaggedTransitions(tag, false, 1, this.maxPerId);
    return transitions.totalCount > this.maxPerId;
  }
}

module.exports = RateLimiter;
