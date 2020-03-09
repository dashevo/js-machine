const { Isolate } = require('isolated-vm');

const DashPlatformProtocol = require('@dashevo/dpp');
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

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const InvalidDataContractError = require('@dashevo/dpp/lib/dataContract/errors/InvalidDataContractError');
const InvalidDocumentError = require('@dashevo/dpp/lib/document/errors/InvalidDocumentError');
const InvalidIdentityError = require('@dashevo/dpp/lib/identity/errors/InvalidIdentityError');

const JsonSchemaError = require('@dashevo/dpp/lib/errors/JsonSchemaError');
const InvalidDocumentTypeError = require('@dashevo/dpp/lib/errors/InvalidDocumentTypeError');

const IsolatedDpp = require('../../../../lib/dpp/isolation/IsolatedDpp');
const compileFileWithBrowserify = require(
  '../../../../lib/dpp/isolation/compileFileWithBrowserify',
);

describe('IsolatedDpp', function main() {
  this.timeout(100000);

  let isolateSnapshot;
  let isolatedDpp;
  let isolateOptions;
  let dataProviderMock;
  let dpp;

  let dataContract;
  let document;
  let identityCreateTransition;
  let identity;
  let documentsStateTransition;
  let dataContractStateTransition;

  before(async () => {
    const isolateDataProviderCode = await compileFileWithBrowserify(
      './internal/createDataProviderWrapper', 'createDataProvider',
    );
    const isolateDppCode = await compileFileWithBrowserify(
      './internal/createDpp', 'createDpp',
    );
    const isolateTimeoutShimCode = await compileFileWithBrowserify(
      './internal/createTimeoutShim', 'createTimeoutShim',
    );

    isolateSnapshot = await Isolate.createSnapshot([
      { code: isolateDataProviderCode },
      { code: isolateDppCode },
      { code: isolateTimeoutShimCode },
    ]);
  });

  beforeEach(function beforeEach() {
    isolateOptions = {
      isolateOptions: {
        memoryLimit: 128,
      },
      executionOptions: {
        arguments: {
          copy: true,
        },
        result: {
          promise: true,
        },
        timeout: 5000,
      },
    };

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

    identityCreateTransition = getIdentityCreateSTFixture();
    documentsStateTransition = new DocumentsStateTransition(documents);
    documentsStateTransition.sign(identityPublicKey, privateKey.toBuffer());

    dataContractStateTransition = new DataContractStateTransition(dataContract);
    dataContractStateTransition.sign(identityPublicKey, privateKey);

    identityCreateTransition.publicKeys = [new IdentityPublicKey({
      id: 1,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    })];
    identityCreateTransition.sign(identityCreateTransition.getPublicKeys()[0], privateKey);

    dataProviderMock = createDataProviderMock(this.sinon);
    dataProviderMock.fetchDataContract.returns(dataContract);

    dpp = new DashPlatformProtocol({ dataProvider: dataProviderMock });

    isolatedDpp = new IsolatedDpp(dpp, isolateSnapshot, isolateOptions);
  });

  describe('dataContract', () => {
    describe('#create', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const contractId = dataContract.getId();

        const result = await dpp.dataContract.create(contractId, dataContract.definitions);
        const isolatedResult = await isolatedDpp.dataContract.create(
          contractId, dataContract.definitions,
        );

        expect(result.toJSON()).to.deep.equal(isolatedResult.toJSON());
      });
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const rawContract = dataContract.toJSON();

        const result = await dpp.dataContract.createFromObject(rawContract);
        const isolatedResult = await isolatedDpp.dataContract.createFromObject(
          rawContract,
        );

        expect(result.toJSON()).to.deep.equal(isolatedResult.toJSON());
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does');
    });

    describe('#createFromSerialized', () => {
      it('should pass through validation result', async () => {
        delete dataContract.ownerId;

        try {
          await isolatedDpp.dataContract.createFromSerialized(
            dataContract.serialize(),
          );
          expect.fail('Error was not thrown');
        } catch (e) {
          expect(e).to.be.an.instanceOf(InvalidDataContractError);

          const [error] = e.getErrors();
          expect(error).to.be.an.instanceOf(JsonSchemaError);
        }
      });

      it('should create data contract from serialized data', async () => {
        const result = await isolatedDpp.dataContract.createFromSerialized(
          dataContract.serialize(),
        );

        expect(result.toJSON()).to.deep.equal(dataContract.toJSON());
      });
    });
  });

  describe('document', () => {
    describe('#create', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const result = await dpp.document.create(
          dataContract, dataContract.ownerId, 'niceDocument', {
            name: 'someName',
          },
        );

        const isolatedResult = await isolatedDpp.document.create(
          dataContract, dataContract.ownerId, 'niceDocument', {
            name: 'someName',
          },
        );

        expect(result.toJSON()).to.deep.equal(isolatedResult.toJSON());
      });
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const rawDocument = document.toJSON();

        const result = await dpp.document.createFromObject(rawDocument);

        const isolatedResult = await isolatedDpp.document.createFromObject(rawDocument);

        expect(result.toJSON()).to.deep.equal(isolatedResult.toJSON());
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does');
    });

    describe('#createFromSerialized', () => {
      it('should pass through validation result', async () => {
        delete document.type;

        try {
          await isolatedDpp.document.createFromSerialized(
            document.serialize(),
          );
          expect.fail('Error was not thrown');
        } catch (e) {
          expect(e).to.be.an.instanceOf(InvalidDocumentError);

          const [error] = e.getErrors();
          expect(error).to.be.an.instanceOf(InvalidDocumentTypeError);
        }
      });

      it('should create document from serialized data', async () => {
        const result = await isolatedDpp.document.createFromSerialized(
          document.serialize(),
        );
        expect(result.toJSON()).to.deep.equal(document.toJSON());
      });
    });
  });

  describe('identity', () => {
    describe('#create', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const { publicKeys } = identityCreateTransition;

        const result = await dpp.identity.create(publicKeys);

        const isolatedResult = await isolatedDpp.identity.create(publicKeys);

        expect(result.toJSON()).to.deep.equal(isolatedResult.toJSON());
      });
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const rawIdentity = identity.toJSON();

        const result = await dpp.identity.createFromObject(rawIdentity);

        const isolatedResult = await isolatedDpp.identity.createFromObject(rawIdentity);

        expect(result.toJSON()).to.deep.equal(isolatedResult.toJSON());
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does');
    });

    describe('#createFromSerialized', () => {
      it('should pass through validation result', async () => {
        delete identity.id;
        try {
          await isolatedDpp.identity.createFromSerialized(
            identity.serialize(),
          );
          expect.fail('Error was not thrown');
        } catch (e) {
          expect(e).to.be.an.instanceOf(InvalidIdentityError);

          const [error] = e.getErrors();
          expect(error).to.be.an.instanceOf(JsonSchemaError);
        }
      });

      it('should create identity from serialized data', async () => {
        const result = await isolatedDpp.identity.createFromSerialized(
          identity.serialize(),
        );
        expect(result.toJSON()).to.deep.equal(identity.toJSON());
      });
    });
  });

  describe('stateTransition', () => {
    describe('#createFromSerialized', () => {
      describe('DocumentsStateTransition', () => {
        it('should pass through validation result');
        it('should create state transition from serialized data');
      });

      describe('DataContractStateTransition', () => {
        it('should pass through validation result');
        it('should create state transition from serialized data');
      });

      describe('IdentityCreateTransition', () => {
        it('should pass through validation result', async () => {
          delete identityCreateTransition.lockedOutPoint;

          try {
            await isolatedDpp.stateTransition.createFromSerialized(
              identityCreateTransition.serialize(),
            );
            expect.fail('Error was not thrown');
          } catch (e) {
            expect(e).to.be.an.instanceOf(InvalidStateTransitionError);

            const [error] = e.getErrors();
            expect(error).to.be.an.instanceOf(JsonSchemaError);
          }
        });

        it('should create state transition from serialized data', async () => {
          const result = await isolatedDpp.stateTransition.createFromSerialized(
            identityCreateTransition.serialize(),
          );

          expect(result.toJSON()).to.deep.equal(identityCreateTransition.toJSON());
        });
      });
    });

    describe('createFromObject', () => {
      describe('DocumentsStateTransition', () => {
        it('should pass through validation result');

        it('should create state transition from object', async () => {
          const result = await isolatedDpp.stateTransition.createFromObject(
            documentsStateTransition.toJSON(),
            { skipValidation: true },
          );

          expect(result.toJSON()).to.be.deep.equal(documentsStateTransition.toJSON());
        });
      });

      describe('DataContractStateTransition', () => {
        it('should pass through validation result');
        it('should create state transition from object', async () => {
          const result = await isolatedDpp.stateTransition.createFromObject(
            dataContractStateTransition.toJSON(),
            { skipValidation: true },
          );

          expect(result.toJSON()).to.be.deep.equal(dataContractStateTransition.toJSON());
        });
      });

      describe('IdentityCreateTransition', () => {
        it('should pass through validation result');

        it('should create state transition from object', async () => {
          const result = await isolatedDpp.stateTransition.createFromObject(
            identityCreateTransition.toJSON(),
          );

          expect(result.toJSON()).to.be.deep.equal(identityCreateTransition.toJSON());
        });
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does when it is valid', async () => {
        const rawStateTransition = identityCreateTransition.toJSON();

        const result = await dpp.stateTransition.validate(rawStateTransition);
        const isolatedResult = await isolatedDpp.stateTransition.validate(
          rawStateTransition,
        );

        expect(result.isValid()).to.be.true();
        expect(result).to.deep.equal(isolatedResult);
      });

      it('should act the same way as not isolated dpp does when it is not valid', async () => {
        const rawStateTransition = identityCreateTransition.toJSON();
        delete rawStateTransition.protocolVersion;

        const result = await dpp.stateTransition.validate(rawStateTransition);
        const isolatedResult = await isolatedDpp.stateTransition.validate(
          rawStateTransition,
        );

        expect(result.isValid()).to.be.false();
        expect(result).to.deep.equal(isolatedResult);
      });
    });
  });

  it('should stop execution if dpp validation takes too much memory');

  it('should stop execution if dpp validation takes too much time');
});
