const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const DashPlatformProtocol = require('@dashevo/dpp');
const nock = require('nock');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const ConsensusError = require('@dashevo/dpp/lib/errors/ConsensusError');
const getDocumentFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const level = require('level-rocksdb');
const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const DocumentsStateTransition = require('@dashevo/dpp/lib/document/stateTransition/DocumentsStateTransition');

const checkTxHandlerFactory = require('../../../../lib/abci/handlers/checkTxHandlerFactory');

const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../lib/abci/errors/AbciError');
const BlockchainState = require('../../../../lib/state/BlockchainState');
const TendermintRPCClient = require('../../../../lib/api/TendermintRPCClient');
const getTxSearchResponse = require('../../../../test/fixtures/getTxSearchResponse');

describe('checkTxHandlerFactory', () => {
  let checkTxHandler;
  let checkTxHandlerWithRateLimiter;
  let request;
  let dppMock;
  let stateTransitionFixture;
  let db;
  let blockchainState;
  let lastBlockHeight;
  let lastBlockAppHash;
  let tendermintRPC;

  beforeEach(function beforeEach() {
    const dpp = new DashPlatformProtocol();
    const documentFixture = getDocumentFixture();
    stateTransitionFixture = dpp.document.createStateTransition(documentFixture);

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    dppMock = createDPPMock(this.sinon);
    dppMock
      .stateTransition
      .createFromSerialized
      .callsFake(async () => new DocumentsStateTransition(documentFixture));

    const host = process.env.TENDERMINT_HOST;
    const port = process.env.TENDERMINT_PORT;
    const response = getTxSearchResponse();
    tendermintRPC = new TendermintRPCClient(host, port);
    const requestUrl = `http://${tendermintRPC.client.options.host}:${tendermintRPC.client.options.port}`;
    nock(requestUrl)
      .post('/')
      .reply(200, response);

    const rateLimiterOffOptions = {
      rateLimiterActive: false,
    };
    const rateLimiterOnOptions = {
      tendermintRPC,
      rateLimiterActive: true,
      rateLimiterInterval: parseInt(process.env.RATE_LIMITER_PER_BLOCK_INTERVAL, 10),
      rateLimiterMax: parseInt(process.env.RATE_LIMITER_MAX_TRANSITIONS_PER_ID, 10),
      rateLimiterIntervalPrefix: process.env.RATE_LIMITER_INTERVAL_PREFIX,
    };

    checkTxHandler = checkTxHandlerFactory(dppMock, rateLimiterOffOptions);
    checkTxHandlerWithRateLimiter = checkTxHandlerFactory(dppMock, rateLimiterOnOptions);
    db = level('./db/state-test', { valueEncoding: 'binary' });
    lastBlockHeight = 1;
    lastBlockAppHash = Buffer.from('something');
    blockchainState = new BlockchainState(lastBlockHeight, lastBlockAppHash);
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  it('should validate a State Transition and return response with code 0', async () => {
    const response = await checkTxHandler(request, blockchainState);

    expect(response).to.be.an.instanceOf(ResponseCheckTx);
    expect(response.code).to.equal(0);

    expect(dppMock.stateTransition.createFromSerialized).to.be.calledOnceWith(request.tx);
  });

  it('should validate a State Transition with rate limiter and return response with code 0', async () => {
    const response = await checkTxHandlerWithRateLimiter(request, blockchainState);

    expect(response).to.be.an.instanceOf(ResponseCheckTx);
    expect(response.code).to.equal(0);

    expect(dppMock.stateTransition.createFromSerialized).to.be.calledOnceWith(request.tx);
  });

  it('should throw InvalidArgumentAbciError if State Transition is not specified', async () => {
    try {
      await checkTxHandler({}, blockchainState);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if State Transition is invalid', async () => {
    const consensusError = new ConsensusError('Invalid state transition');
    const error = new InvalidStateTransitionError(
      [consensusError],
      stateTransitionFixture.toJSON(),
    );

    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await checkTxHandler(request, blockchainState);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.getData()).to.deep.equal({
        errors: [consensusError],
      });
    }
  });

  it('should throw the error from createFromSerialized if throws not InvalidStateTransitionError', async () => {
    const error = new Error('Custom error');
    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await checkTxHandler(request, blockchainState);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.equal(error);
    }
  });
});
