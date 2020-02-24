const sinon = require('sinon');
const MissingOptionError = require('@dashevo/dpp/lib/errors/MissingOptionError');
const DPP = require('@dashevo/dpp');
const IdentityPublicKey = require('@dashevo/dpp/lib/identity/IdentityPublicKey');
const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const { PrivateKey } = require('@dashevo/dashcore-lib');
const { Isolate } = require('isolated-vm');

const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');

const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const createIsolatedDpp = require('../../../../lib/dpp/isolation/createIsolatedDpp');
const invokeFunctionFromIsolate = require('../../../../lib/dpp/isolation/invokeFunctionFromIsolate');

describe('createIsolatedDpp', function () {
  let dataProvideMock;
  let dpp;
  let isolate;
  this.timeout(100000);

  beforeEach(() => {
    dataProvideMock = createDataProviderMock(sinon);
    dpp = new DPP({ dataProvider: dataProvideMock });
    isolate = new Isolate();
  });

  it('should parse state transition', async () => {
    const isolatedDpp = await createIsolatedDpp(dataProvideMock);
    const serializedIdentityCreateST = getIdentityCreateSTFixture().serialize().toString('hex');

    const parsedTransition = await isolatedDpp
      .stateTransition
      .createFromSerialized(
        serializedIdentityCreateST,
        { skipValidation: true },
      );

    expect(parsedTransition).to.be.deep.equal(getIdentityCreateSTFixture());
  });

  it('should create a reference to the data provider and call it when needed', async () => {
    const isolatedDpp = await createIsolatedDpp(dataProvideMock);
    const identityCreateSTFixture = getIdentityCreateSTFixture();
    const privateKey = new PrivateKey();
    identityCreateSTFixture.publicKeys = [new IdentityPublicKey({
      id: 1,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    })];
    identityCreateSTFixture.sign(identityCreateSTFixture.getPublicKeys()[0], privateKey);
    const serializedIdentityCreateST = identityCreateSTFixture.serialize().toString('hex');

    const parsedTransition = await isolatedDpp
      .stateTransition
      .createFromSerialized(
        serializedIdentityCreateST,
      );

    // This won't work because we need to pass an instance to validateData instead of a raw object
    const validationResult = await isolatedDpp.stateTransition.validateData(parsedTransition);

    expect(dataProvideMock.fetchIdentity.callCount).to.be.equal(1);
    expect(validationResult).to.be.instanceOf(ValidationResult);
  });

  it('should throw correct error', async () => {
    const isolatedDpp = await createIsolatedDpp(dataProvideMock);
    const identityCreateStObject = getIdentityCreateSTFixture().toJSON();
    // identityCreateStObject.publicKeys = null;
    // identityCreateStObject.identityType = 10123;

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

  it('should stop execution if dpp validation takes too much time', async () => {
    throw new Error('Not implemented');
  });
  it('should invoke from global', async () => {
    const context = await isolate.createContext();
    const { global: jail } = context;
    await jail.set('global', jail.derefInto());
    await context.eval('global.myFunction = function myFunction(){ return true; }');

    await invokeFunctionFromIsolate(jail, '', 'myFunction', []);
  });
});
