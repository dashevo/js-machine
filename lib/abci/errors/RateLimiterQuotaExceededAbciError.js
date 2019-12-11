const AbciError = require('./AbciError');

class RateLimiterQuotaExceededAbciError extends AbciError {
  /**
   * @param {string} userId
   * @param {Object={}} tags
   */
  constructor(userId, tags = {}) {
    super(
      AbciError.CODES.RATE_LIMITER_QUOTA_EXCEEDED,
      `State transition quota exceeded for identity ${userId}`,
      { userId },
      tags,
    );

    this.userId = userId;
  }

  /**
   * Get user id
   */
  getUserId() {
    return this.userId;
  }
}

module.exports = RateLimiterQuotaExceededAbciError;
