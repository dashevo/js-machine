const createDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');

const createIsolatedValidatorSnapshot = require('../../lib/dpp/jsonSchema/createIsolatedValidatorSnapshot');
const createIsolatedDpp = require('../../lib/dpp/jsonSchema/createIsolatedDpp');

describe.only('isolated validator', () => {
  it('test it out', async function it() {
    const dataProviderMock = createDataProviderMock(this.sinon);
    const dataContractFixture = createDataContractFixture();

    const snapshot = await createIsolatedValidatorSnapshot();

    const isolatedDpp = await createIsolatedDpp(
      snapshot,
      dataProviderMock,
      { memoryLimit: 128, timeout: 500 },
    );

    delete dataContractFixture.documents;

    let result;
    try {
      result = await isolatedDpp.dataContract.validate(dataContractFixture);
    } finally {
      isolatedDpp.dispose();
    }

    // eslint-disable-next-line no-console
    console.dir(result);
  });
});
