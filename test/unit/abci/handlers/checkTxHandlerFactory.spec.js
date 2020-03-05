const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const DashPlatformProtocol = require('@dashevo/dpp');

const getDocumentFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const level = require('level-rocksdb');

const checkTxHandlerFactory = require('../../../../lib/abci/handlers/checkTxHandlerFactory');

const AbciError = require('../../../../lib/abci/errors/AbciError');
const RateLimiterQuotaExceededAbciError = require(
  '../../../../lib/abci/errors/RateLimiterQuotaExceededAbciError',
);
const RateLimiterUserIsBannedAbciError = require(
  '../../../../lib/abci/errors/RateLimiterUserIsBannedAbciError',
);

const BlockchainState = require('../../../../lib/state/BlockchainState');

const RateLimiterMock = require('../../../../lib/test/mock/RateLimiterMock');

describe('checkTxHandlerFactory', () => {
  let checkTxHandler;
  let request;
  let stateTransitionFixture;
  let db;
  let blockchainState;
  let lastBlockHeight;
  let lastBlockAppHash;
  let rateLimiterMock;
  let unserializeStateTransitionMock;

  beforeEach(function beforeEach() {
    const dpp = new DashPlatformProtocol();
    const documentFixture = getDocumentFixture();
    stateTransitionFixture = dpp.document.createStateTransition(documentFixture);

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    unserializeStateTransitionMock = this.sinon.stub()
      .resolves(stateTransitionFixture);

    rateLimiterMock = new RateLimiterMock(this.sinon);

    lastBlockHeight = 1;
    lastBlockAppHash = Buffer.from('something');
    blockchainState = new BlockchainState(lastBlockHeight, lastBlockAppHash);

    checkTxHandler = checkTxHandlerFactory(
      unserializeStateTransitionMock,
      blockchainState,
      rateLimiterMock,
      false,
    );

    db = level('./db/state-test', { valueEncoding: 'binary' });
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  it('should validate a State Transition and return response with code 0', async () => {
    const response = await checkTxHandler(request);

    expect(response).to.be.an.instanceOf(ResponseCheckTx);
    expect(response.code).to.equal(0);

    expect(unserializeStateTransitionMock).to.be.calledOnceWith(request.tx);
  });

  describe('with rate limiter', () => {
    it('should validate a State Transition with rate limiter and return response with code 0', async () => {
      checkTxHandler = checkTxHandlerFactory(
        unserializeStateTransitionMock,
        blockchainState,
        rateLimiterMock,
        true,
      );

      const response = await checkTxHandler(request);

      expect(response).to.be.an.instanceOf(ResponseCheckTx);
      expect(response.code).to.equal(0);

      expect(unserializeStateTransitionMock).to.be.calledOnceWith(request.tx);
    });

    it('should validate a State Transition with rate limiter and throw quota exceeded error', async () => {
      lastBlockHeight = 11;
      lastBlockAppHash = Buffer.from('something');
      blockchainState = new BlockchainState(lastBlockHeight, lastBlockAppHash);

      rateLimiterMock.getBannedKey.returns('rateLimitedBanKey');
      rateLimiterMock.isQuotaExceeded.resolves(true);

      checkTxHandler = checkTxHandlerFactory(
        unserializeStateTransitionMock,
        blockchainState,
        rateLimiterMock,
        true,
      );

      const { userId } = stateTransitionFixture.documents[0];

      try {
        await checkTxHandler(request);
        expect.fail('Error was not thrown');
      } catch (e) {
        expect(e).to.be.an.instanceOf(RateLimiterQuotaExceededAbciError);
        expect(e.getCode()).to.equal(AbciError.CODES.RATE_LIMITER_QUOTA_EXCEEDED);
        expect(e.getUserId()).to.equal(userId);
        expect(e.data).to.deep.equal({ userId });
        expect(e.tags).to.deep.equal({
          rateLimitedBanKey: userId,
          bannedUserIds: userId,
        });
      }
    });

    it('should validate a State Transition with rate limiter and throw user is banned error', async () => {
      lastBlockHeight = 111;
      lastBlockAppHash = Buffer.from('something');
      blockchainState = new BlockchainState(lastBlockHeight, lastBlockAppHash);

      rateLimiterMock.isBannedUser.resolves(true);

      checkTxHandler = checkTxHandlerFactory(
        unserializeStateTransitionMock,
        blockchainState,
        rateLimiterMock,
        true,
      );

      const { userId } = stateTransitionFixture.documents[0];

      try {
        await checkTxHandler(request);
        expect.fail('Error was not thrown');
      } catch (e) {
        expect(e).to.be.an.instanceOf(RateLimiterUserIsBannedAbciError);
        expect(e.getCode()).to.equal(AbciError.CODES.RATE_LIMITER_BANNED);
        expect(e.getUserId()).to.equal(userId);
        expect(e.data).to.deep.equal({ userId });
      }
    });
  });
});
