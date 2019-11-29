const TendermintRPCClient = require('../../../lib/api/TendermintRPCClient');
const createTendermintRPCClientMock = require('../../../lib/test/mock/createTendermintRPCClientMock');

describe('TendermintRPCClient', () => {
  let tendermintRpcMock;

  beforeEach(function beforeEach() {
    tendermintRpcMock = createTendermintRPCClientMock(this.sinon);
  });

  it('should constuct a TendermintRPCClient instance', async () => {
    const tendermintRPC = new TendermintRPCClient();

    expect(tendermintRPC).to.be.instanceOf(TendermintRPCClient);
    expect(tendermintRPC.client.options.host).to.be.a('string');
    expect(tendermintRPC.client.options.port).to.be.a('string');
  });

  it('should fetch a transition by tag just with key', async () => {
    const key = '';
    const response = await tendermintRpcMock.fetchTransitionsByTag(key);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('totalCount');
    expect(response).to.deep.include({
      totalCount: 12,
    });
  });

  it('should fetch a transition by tag with key and value', async () => {
    const key = '';
    const value = '';
    const response = await tendermintRpcMock.fetchTransitionsByTag(key, value);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('totalCount');
    expect(response).to.deep.include({
      totalCount: 12,
    });
  });

  it('should fetch a transition by tag with key, value and prove', async () => {
    const key = '';
    const value = '';
    const prove = true;
    const response = await tendermintRpcMock.fetchTransitionsByTag(key, value, prove);

    expect(response).to.be.instanceOf(Object);
    expect(response).to.have.property('totalCount');
    expect(response).to.deep.include({
      totalCount: 12,
    });
  });
});
