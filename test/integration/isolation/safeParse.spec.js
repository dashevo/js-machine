const sinon = require('sinon');
const DashPlatformProtocol = require('@dashevo/dpp');

const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');

const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const createSafeDPP = require('../../../lib/isolation/safeParse');

describe('safeParse', function () {
  let identityCreateTransitionFixture;
  let dataProvideMock;
  this.timeout(100000);

  beforeEach(() => {
    dataProvideMock = createDataProviderMock(sinon);
    identityCreateTransitionFixture = getIdentityCreateSTFixture();
  });

  it('should parse state transition', async () => {
    console.time('create');
    const isolatedDPP = await createSafeDPP(dataProvideMock);
    console.timeEnd('create');
    const serializedIdentityCreateST = getIdentityCreateSTFixture().serialize();

    // const dpp = new DashPlatformProtocol();
    // const st = await dpp.stateTransition.createFromSerialized(serializedIdentityCreateST, { skipValidation: true });
    // console.log(st);
    console.time('parse');
    const parsedTransition = await isolatedDPP
      .stateTransition
      .createFromSerialized(
        serializedIdentityCreateST.toString('hex'),
        { skipValidation: true },
      );
    console.timeEnd('parse');

    console.log(parsedTransition);
    expect(parsedTransition).to.be.deep.equal(getIdentityCreateSTFixture());
  });

  it('Should stop execution if dpp validation takes too much memory', async () => {
    console.time('create');
    const safeParse = await createSafeDPP(dataProvideMock);
    console.timeEnd('create');
    const serializedIdentityCreateST = getIdentityCreateSTFixture().serialize();

    console.time('parse');
    const parsedTransition = await safeParse(serializedIdentityCreateST);
    console.timeEnd('parse');

    expect(parsedTransition).to.be.deep.equal(getIdentityCreateSTFixture());
  });

  it('Should stop execution if schema takes too much time', async () => {
    throw new Error('Not implemented');
  });
});
