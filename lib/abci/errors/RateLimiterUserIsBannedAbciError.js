const AbciError = require('./AbciError');

class RateLimiterUserIsBannedAbciError extends AbciError {
  /**
   * @param {string} userId
   */
  constructor(userId) {
    super(
      AbciError.CODES.RATE_LIMITER_BANNED,
      `Identity ${userId} is banned for some time`,
      { userId },
    );

    this.userId = userId;
  }

  /**
   * Get user id
   *
   * @return {string}
   */
  getUserId() {
    return this.userId;
  }
}

module.exports = RateLimiterUserIsBannedAbciError;
