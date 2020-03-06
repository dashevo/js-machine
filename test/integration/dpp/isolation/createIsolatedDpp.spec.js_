const { Isolate } = require('isolated-vm');

const sinon = require('sinon');
const MissingOptionError = require('@dashevo/dpp/lib/errors/MissingOptionError');
const DPP = require('@dashevo/dpp');
const IdentityPublicKey = require('@dashevo/dpp/lib/identity/IdentityPublicKey');
const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const { PrivateKey } = require('@dashevo/dashcore-lib');
const generateRandomId = require('@dashevo/dpp/lib/test/utils/generateRandomId');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
// The regexp below explodes exponentially.
// On a string that contains 'x' with length above 30
// it will take at least several seconds on a modern hardware.
// It takes about 3 seconds with 29 symbols on 2019 16" MacBook Pro,
// And with 30 symbols it's already ~6 seconds, and with 31 symbols it's 12 sec
const exponentialPattern = '(x+x+)+y';
const stringThatExponentialyBlowsRegexp = 'x'.repeat(31);

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
    const isolatedDpp = await createIsolatedDpp(dataProvideMock, 128, 1000);
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
    const isolatedDpp = await createIsolatedDpp(dataProvideMock, 128, 1000);
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

    const validationResult = await isolatedDpp.stateTransition.validateData(parsedTransition);

    expect(dataProvideMock.fetchIdentity.callCount).to.be.equal(1);
    expect(validationResult).to.be.instanceOf(ValidationResult);
    // TODO: make a test for the case when validation result is false
  });

  it('should throw correct error', async () => {
    const isolatedDpp = await createIsolatedDpp(dataProvideMock, 128, 1000);
    const identityCreateStObject = getIdentityCreateSTFixture().toJSON();

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
    const isolatedDpp = await createIsolatedDpp(dataProvideMock, 128, 100);

    // TODO: move this section to beforeEach
    const idenitity = getIdentityFixture();
    const privateKey = new PrivateKey();
    const identityPublicKey = new IdentityPublicKey({
      id: 101,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    });
    idenitity.publicKeys.push(identityPublicKey);
    // Identity init

    // Creating dangerous contract fixture
    const contractId = generateRandomId();
    const dangerousDocSchema = {
      doc: {
        properties: {
          str: {
            type: 'string',
            pattern: exponentialPattern,
          },
        },
        additionalProperties: false,
      },
    };
    const contract = await dpp.dataContract.create(contractId, dangerousDocSchema);
    dataProvideMock.fetchDataContract.resolves(contract);
    const exponentialDoc = await dpp.document.create(
      contract,
      idenitity.getId(),
      'doc',
      { str: stringThatExponentialyBlowsRegexp },
    );

    // Creating document that exploits dangerous contract
    const documentSt = await dpp.document.createStateTransition([exponentialDoc]);
    documentSt.sign(identityPublicKey, privateKey);

    // try {
    //   const st2 = await dpp.stateTransition.createFromSerialized(documentSt.serialize().toString('hex'));
    // } catch (e) {
    //   console.log('Failed to parse without isolation:');
    //   console.dir(e);
    // }

    console.time('c');
    let error;
    try {
      await isolatedDpp.stateTransition.createFromSerialized(documentSt.serialize().toString('hex'));
    } catch (e) {
      error = e;
    }
    console.timeEnd('c');

    console.log('Error in the end:');
    console.dir(error);
    expect(error).to.be.equal('kek');
  });
});
