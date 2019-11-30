const nock = require('nock');
const TendermintRPCClient = require('../../../lib/api/TendermintRPCClient');

describe('TendermintRPCClient', () => {
  let tendermintRPC;

  beforeEach(() => {
    const response = { totalCount: 12 };
    tendermintRPC = new TendermintRPCClient();
    const requestUrl = `http://${tendermintRPC.client.options.host}:${tendermintRPC.client.options.port}`;
    nock(requestUrl)
      .post('/')
      .reply(200, response);
  });

  it('should construct a TendermintRPCClient instance', async () => {
    expect(tendermintRPC).to.be.instanceOf(TendermintRPCClient);
    expect(tendermintRPC.client.options.host).to.be.a('string');
    expect(tendermintRPC.client.options.port).to.be.a('string');
  });

  it('should fetch a transition by tag just with key', async () => {
    const key = 'myKey';
    const response = await tendermintRPC.fetchTransitionsByTag(key);
    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('totalCount');
    expect(response).to.deep.include({
      totalCount: 12,
    });
  });

  it('should fetch a transition by tag with key and value', async () => {
    const key = 'myKey';
    const value = 'myValue';
    const response = await tendermintRPC.fetchTransitionsByTag(key, value);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('totalCount');
    expect(response).to.deep.include({
      totalCount: 12,
    });
  });

  it('should fetch a transition by tag with key, value and prove', async () => {
    const key = 'myKey';
    const value = 'myValue';
    const prove = true;
    const response = await tendermintRPC.fetchTransitionsByTag(key, value, prove);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('totalCount');
    expect(response).to.deep.include({
      totalCount: 12,
    });
  });
});
