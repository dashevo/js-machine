/**
 * @param sinonSandbox
 * @return {Object}
 */
module.exports = function createTendermintRPCClientMock(sinonSandbox) {
  return {
    fetchTransitionsByTag: sinonSandbox.stub()
      .callsFake(async () => ({ totalCount: 12 })),
  };
};
