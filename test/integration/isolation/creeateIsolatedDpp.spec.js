const sinon = require('sinon');

const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');

const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const createSafeDPP = require('../../../lib/isolation/createIsolatedDpp');

describe('createIsolatedDpp', function () {
  let dataProvideMock;
  this.timeout(100000);

  beforeEach(() => {
    dataProvideMock = createDataProviderMock(sinon);
  });

  it('should parse state transition', async () => {
    const isolatedDPP = await createSafeDPP(dataProvideMock);
    const serializedIdentityCreateST = getIdentityCreateSTFixture().serialize();

    const parsedTransition = await isolatedDPP
      .stateTransition
      .createFromSerialized(
        serializedIdentityCreateST.toString('hex'),
        { skipValidation: true },
      );

    expect(parsedTransition).to.be.deep.equal(getIdentityCreateSTFixture());
  });

  it('Should stop execution if dpp validation takes too much memory', async () => {
    throw new Error('Not implemented');
  });

  it('Should stop execution if schema takes too much time', async () => {
    throw new Error('Not implemented');
  });
});
