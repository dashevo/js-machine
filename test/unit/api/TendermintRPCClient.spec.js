const nock = require('nock');
const TendermintRPCClient = require('../../../lib/api/TendermintRPCClient');
const getTxSearchResponse = require('../../../test/fixtures/getTxSearchResponse');

describe('TendermintRPCClient', () => {
  let tendermintRPC;
  const host = process.env.TENDERMINT_HOST;
  const port = process.env.TENDERMINT_RPC_PORT;

  beforeEach(() => {
    const response = getTxSearchResponse.getHits();
    tendermintRPC = new TendermintRPCClient(host, port);
    const requestUrl = `http://${tendermintRPC.client.options.host}:${tendermintRPC.client.options.port}`;
    nock(requestUrl)
      .post('/')
      .reply(200, response);
  });

  it('should construct a TendermintRPCClient instance', async () => {
    expect(tendermintRPC).to.be.instanceOf(TendermintRPCClient);
  });

  it('should fetch a transition by tag just with key', async () => {
    const key = 'myKey';
    const response = await tendermintRPC.fetchTransitionsByEvent(key);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('txs');
    expect(response.txs[0]).to.have.property('proof');
    expect(response).to.have.property('total_count');
    expect(response.total_count).to.equal('12');
  });

  it('should fetch a transition by tag with key and value', async () => {
    const key = 'myKey';
    const value = 'myValue';
    const response = await tendermintRPC.fetchTransitionsByEvent(key, value);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('txs');
    expect(response.txs[0]).to.have.property('proof');
    expect(response).to.have.property('total_count');
    expect(response.total_count).to.equal('12');
  });

  it('should fetch a transition by tag with key, value and prove', async () => {
    const key = 'myKey';
    const value = 'myValue';
    const prove = true;
    const response = await tendermintRPC.fetchTransitionsByEvent(key, value, prove);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('txs');
    expect(response.txs[0]).to.have.property('proof');
    expect(response).to.have.property('total_count');
    expect(response.total_count).to.equal('12');
  });
});
