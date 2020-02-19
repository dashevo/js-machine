const sinon = require('sinon');
const MissingOptionError = require('@dashevo/dpp/lib/errors/MissingOptionError');

const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');

const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const createIsolatedDpp = require('../../../../lib/dpp/isolation/createIsolatedDpp');

describe('createIsolatedDpp', function () {
  let dataProvideMock;
  this.timeout(100000);

  beforeEach(() => {
    dataProvideMock = createDataProviderMock(sinon);
  });

  it('should parse state transition', async () => {
    const isolatedDpp = await createIsolatedDpp(dataProvideMock);
    const serializedIdentityCreateST = getIdentityCreateSTFixture().serialize();

    const parsedTransition = await isolatedDpp
      .stateTransition
      .createFromSerialized(
        serializedIdentityCreateST.toString('hex'),
        { skipValidation: true },
      );

    expect(parsedTransition).to.be.deep.equal(getIdentityCreateSTFixture());
  });

  it('should create a reference to the data provider and call it when needed', async () => {
    const isolatedDpp = await createIsolatedDpp(dataProvideMock);
    const serializedIdentityCreateST = getIdentityCreateSTFixture().serialize();

    const parsedTransition = await isolatedDpp
      .stateTransition
      .createFromSerialized(
        serializedIdentityCreateST.toString('hex'),
        { skipValidation: true },
      );

    expect(parsedTransition).to.be.deep.equal(getIdentityCreateSTFixture());
    expect(dataProvideMock.fetchIdentity.calledOnce).to.be.true();
  });

  it('should throw correct error', async () => {
    const isolatedDpp = await createIsolatedDpp(dataProvideMock);
    const identityCreateStObject = getIdentityCreateSTFixture().toJSON();
    identityCreateStObject.publicKeys = null;
    identityCreateStObject.identityType = 10123;

    let error;

    try {
      await isolatedDpp
        .stateTransition
        .createFromObject(
          identityCreateStObject,
        );
    } catch (e) {
      error = e;
    }

    console.error(error);
    expect(error).to.be.an.instanceOf(MissingOptionError);
    expect(error.message).to.be.equal('Can\'t create State Transition because Data Provider is not set, use setDataProvider method');
  });

  it('should stop execution if dpp validation takes too much memory', async () => {
    throw new Error('Not implemented');
  });

  it('should stop execution if schema takes too much time', async () => {
    throw new Error('Not implemented');
  });
});
