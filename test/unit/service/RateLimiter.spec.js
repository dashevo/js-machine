const RateLimiter = require('../../../lib/services/RateLimiter');

describe('RateLimiter', () => {
  let rateLimiter;
  let rateLimiterOptions;
  let fetchTransitionCountByEventMock;

  beforeEach(function beforeEach() {
    fetchTransitionCountByEventMock = this.sinon.stub();

    rateLimiterOptions = {
      rateLimiterInterval: 1,
      rateLimiterMax: 2,
      rateLimiterPrefix: 'prefix',
      rateLimiterBanPrefix: 'ban.prefix',
      rateLimiterBanInterval: 3,
    };

    rateLimiter = new RateLimiter(
      fetchTransitionCountByEventMock,
      rateLimiterOptions,
    );
  });

  describe('#constructor', () => {
    it('should set instance variables', () => {
      expect(rateLimiter.fetchTransitionCountByEvent).to.deep.equal(
        fetchTransitionCountByEventMock,
      );
      expect(rateLimiter.perBlockInterval).to.deep.equal(rateLimiterOptions.rateLimiterInterval);
      expect(rateLimiter.maxPerId).to.deep.equal(rateLimiterOptions.rateLimiterMax);
      expect(rateLimiter.rateLimiterIntervalPrefix).to.deep.equal(
        rateLimiterOptions.rateLimiterPrefix,
      );
      expect(rateLimiter.rateLimiterBanPrefix).to.deep.equal(
        rateLimiterOptions.rateLimiterBanPrefix,
      );
      expect(rateLimiter.rateLimiterBanInterval).to.deep.equal(
        rateLimiterOptions.rateLimiterBanInterval,
      );
    });
  });

  describe('#getRateLimitedKey', () => {
    it('should return calculated key for a block height', () => {
      const blockHeight = 42;
      const expectedPeriod = Math.floor(blockHeight / rateLimiter.perBlockInterval);
      const expectedKey = `${rateLimiter.rateLimiterIntervalPrefix}.${expectedPeriod}`;

      const result = rateLimiter.getRateLimitedKey(blockHeight);

      expect(result).to.equal(expectedKey);
    });
  });

  describe('#getBannedKey', () => {
    it('should return calculated key for a block height', () => {
      const blockHeight = 42;
      const expectedPeriod = Math.floor(blockHeight / rateLimiter.rateLimiterBanInterval);
      const expectedKey = `${rateLimiter.rateLimiterBanPrefix}.${expectedPeriod}`;

      const result = rateLimiter.getBannedKey(blockHeight);

      expect(result).to.equal(expectedKey);
    });
  });

  describe('#isBannedUser', () => {
    it('should return false if no transitions found', async () => {
      const userId = 'userId';
      const blockHeight = 42;
      const expectedPeriod = Math.floor(blockHeight / rateLimiter.rateLimiterBanInterval);
      const expectedKey = `${rateLimiter.rateLimiterBanPrefix}.${expectedPeriod}`;

      fetchTransitionCountByEventMock.resolves(0);

      const result = await rateLimiter.isBannedUser(userId, blockHeight);

      expect(fetchTransitionCountByEventMock).to.have.been.calledOnceWithExactly(
        expectedKey, userId, { prove: true },
      );

      expect(result).to.be.false();
    });

    it('should return true if some transitions found', async () => {
      const userId = 'userId';
      const blockHeight = 42;

      fetchTransitionCountByEventMock.resolves(42);

      const result = await rateLimiter.isBannedUser(userId, blockHeight);

      expect(result).to.be.true();
    });
  });

  describe('#isQuotaExceeded', () => {
    it('should return false if no transitions found', async () => {
      const userId = 'userId';
      const blockHeight = 42;
      const expectedPeriod = Math.floor(blockHeight / rateLimiter.perBlockInterval);
      const expectedKey = `${rateLimiter.rateLimiterIntervalPrefix}.${expectedPeriod}`;

      fetchTransitionCountByEventMock.resolves(0);

      const result = await rateLimiter.isQuotaExceeded(userId, blockHeight);

      expect(fetchTransitionCountByEventMock).to.have.been.calledOnceWithExactly(
        expectedKey, userId, { prove: true },
      );

      expect(result).to.be.false();
    });

    it('should return true if some transitions found', async () => {
      const userId = 'userId';
      const blockHeight = 42;

      fetchTransitionCountByEventMock.resolves(42);

      const result = await rateLimiter.isQuotaExceeded(userId, blockHeight);

      expect(result).to.be.true();
    });
  });
});
