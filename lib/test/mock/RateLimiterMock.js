class RateLimiterMock {
  /**
   * @param {Sandbox} sinon
   */
  constructor(sinon) {
    this.isQuotaExceeded = sinon.stub();
    this.isBannedUser = sinon.stub();
    this.getRateLimitedKey = sinon.stub();
    this.getBannedKey = sinon.stub();
  }
}

module.exports = RateLimiterMock;
