const AbciError = require('./AbciError');

class RateLimiterUserIsBannedAbciError extends AbciError {
  /**
   * @param {Object} data
   */
  constructor(data) {
    super(
      AbciError.CODES.RATE_LIMITER_BANNED,
      `Identity ${data.userId} is banned for some time`,
      data,
    );
  }
}

module.exports = RateLimiterUserIsBannedAbciError;
