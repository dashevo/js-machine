const AbciError = require('./AbciError');

class RateLimiterQuotaExceededAbciError extends AbciError {
  /**
   * @param {Object} data
   * @param {{ key: string, value: string }[]=[]} tags
   */
  constructor(data, tags = []) {
    super(
      AbciError.CODES.RATE_LIMITER_QUOTA_EXCEEDED,
      `State transition quota exceeded for identity ${data.userId}`,
      data,
      tags,
    );
  }
}

module.exports = RateLimiterQuotaExceededAbciError;
