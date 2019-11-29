/**
 * @param sinonSandbox
 * @return {TendermintRPCClient}
 */
module.exports = function createTendermintRPCClientMock(sinonSandbox) {
  return {
    fetchTransitionsByTag: sinonSandbox.stub()
      .callsFake(async () => ({ totalCount: 12 })),
  };
};
