const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const DocumentsStateTransition = require('@dashevo/dpp/lib/document/stateTransition/DocumentsStateTransition');

/**
 * @param {Sandbox} sinonSandbox
 *
 * @returns {DashPlatformProtocol}
 */
module.exports = function createDPPMock(sinonSandbox) {
  const dataContract = {
    create: sinonSandbox.stub(),
    createFromObject: sinonSandbox.stub(),
    createFromSerialized: sinonSandbox.stub(),
    validate: sinonSandbox.stub(),
  };

  const document = {
    create: sinonSandbox.stub(),
    createFromObject: sinonSandbox.stub(),
    createFromSerialized: sinonSandbox.stub(),
    validate: sinonSandbox.stub(),
  };

  const stateTransition = {
    createFromObject: sinonSandbox.stub(),
    createFromSerialized: sinonSandbox.stub()
      .callsFake(async () => {
        const documents = getDocumentsFixture();
        return new DocumentsStateTransition(documents);
      }),
    validate: sinonSandbox.stub(),
    validateStructure: sinonSandbox.stub(),
    validateData: sinonSandbox.stub(),
  };

  const identity = {
    create: sinonSandbox.stub(),
    createFromObject: sinonSandbox.stub(),
    createFromSerialized: sinonSandbox.stub(),
    validate: sinonSandbox.stub(),
  };

  return {
    dataContract,
    document,
    stateTransition,
    identity,
    getUserId: sinonSandbox.stub(),
    setUserId: sinonSandbox.stub(),
    getDataContract: sinonSandbox.stub(),
    setDataContract: sinonSandbox.stub(),
    getDataProvider: sinonSandbox.stub(),
    setDataProvider: sinonSandbox.stub(),
  };
};
