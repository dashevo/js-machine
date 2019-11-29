describe('TendermintRPCClient', () => {
  let tendermintRpcMock;
  const responseFixture = { totalCount: 12 };

  beforeEach(() => {
    tendermintRpcMock = {
      fetchTransitionsByTag: this.sinon.stub(),
    };

    tendermintRpcMock
      .fetchTransitionsByTag
      .callsFake(async () => responseFixture);
  });

  it('should fetch a transition by tag', async () => {
    const key = '';
    const value = '';
    const response = await tendermintRpcMock.fetchTransitionsByTag(key, value, true);

    expect(response).to.deep.include({
      totalCount: 12,
    });
  });
});
