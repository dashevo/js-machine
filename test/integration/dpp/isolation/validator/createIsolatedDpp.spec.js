/* eslint-disable no-console */
const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getIdentityCreateSTFixture = require(
  '@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture',
);
const DocumentsStateTransition = require('@dashevo/dpp/lib/document/stateTransition/DocumentsStateTransition');
const DataContractStateTransition = require('@dashevo/dpp/lib/dataContract/stateTransition/DataContractStateTransition');

const IdentityPublicKey = require('@dashevo/dpp/lib/identity/IdentityPublicKey');
const { PrivateKey } = require('@dashevo/dashcore-lib');

const createIsolatedValidatorSnapshot = require('../../../../../lib/dpp/isolation/validator/createIsolatedValidatorSnapshot');
const createIsolatedDpp = require('../../../../../lib/dpp/isolation/validator/createIsolatedDpp');

describe.only('isolated validator', () => {
  let dataContract;
  let document;
  let identityCreateTransition;
  let identity;
  let documentsStateTransition;
  let dataContractStateTransition;

  it('test it out', async function it() {
    const privateKey = new PrivateKey();
    const publicKey = privateKey.toPublicKey().toBuffer().toString('base64');
    const publicKeyId = 1;

    const identityPublicKey = new IdentityPublicKey()
      .setId(publicKeyId)
      .setType(IdentityPublicKey.TYPES.ECDSA_SECP256K1)
      .setData(publicKey);

    dataContract = getDataContractFixture();
    const documents = getDocumentsFixture();
    [document] = documents;
    document.contractId = dataContract.getId();
    identity = getIdentityFixture();
    identity.type = 2;
    identity.publicKeys = [
      identityPublicKey,
    ];

    identityCreateTransition = getIdentityCreateSTFixture();
    documentsStateTransition = new DocumentsStateTransition(documents);
    documentsStateTransition.sign(identityPublicKey, privateKey);

    dataContractStateTransition = new DataContractStateTransition(dataContract);
    dataContractStateTransition.sign(identityPublicKey, privateKey);

    identityCreateTransition.publicKeys = [new IdentityPublicKey({
      id: 1,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    })];
    identityCreateTransition.sign(identityCreateTransition.getPublicKeys()[0], privateKey);


    const dataProviderMock = createDataProviderMock(this.sinon);

    console.time('createIsolatedValidatorSnapshot');
    const snapshot = await createIsolatedValidatorSnapshot();
    console.timeEnd('createIsolatedValidatorSnapshot');


    console.log(snapshot.copy().byteLength);


    console.time('createIsolatedDpp');
    const isolatedDpp = await createIsolatedDpp(
      snapshot,
      dataProviderMock,
      { memoryLimit: 128, timeout: 500 },
    );
    console.timeEnd('createIsolatedDpp');


    let result;
    try {
      console.time('isolatedDpp.stateTransition.createFromSerialized');
      result = await isolatedDpp.stateTransition.createFromSerialized(
        dataContractStateTransition.serialize(),
      );
    } catch (e) {
    } finally {
      console.timeEnd('isolatedDpp.stateTransition.createFromSerialized');
      // isolatedDpp.dispose();
    }

    try {
      console.time('isolatedDpp.stateTransition.createFromSerialized2');
      result = await isolatedDpp.stateTransition.createFromSerialized(
        dataContractStateTransition.serialize(),
      );
    } catch (e) {

    } finally {
      console.timeEnd('isolatedDpp.stateTransition.createFromSerialized2');
      // isolatedDpp.dispose();
    }


    isolatedDpp.dispose();

    console.dir(result);
  });
});
