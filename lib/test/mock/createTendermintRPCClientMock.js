/**
 * @param sinon
 * @return {TendermintRPCClient}
 */
module.exports = function createTendermintRPCClientMock(sinon) {
  return {
    fetchTransitionsByTag: sinon.stub()
      .callsFake(async () => ({ totalCount: 12 })),
  };
};
