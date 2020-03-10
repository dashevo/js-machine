const DashPlatformProtocol = require('@dashevo/dpp');
const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getIdentityCreateSTFixture = require(
  '@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture',
);
const generateRandomId = require('@dashevo/dpp/lib/test/utils/generateRandomId');

const IdentityPublicKey = require('@dashevo/dpp/lib/identity/IdentityPublicKey');
const { PrivateKey } = require('@dashevo/dashcore-lib');

const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const InvalidDataContractError = require('@dashevo/dpp/lib/dataContract/errors/InvalidDataContractError');
const InvalidDocumentError = require('@dashevo/dpp/lib/document/errors/InvalidDocumentError');
const InvalidIdentityError = require('@dashevo/dpp/lib/identity/errors/InvalidIdentityError');

const JsonSchemaError = require('@dashevo/dpp/lib/errors/JsonSchemaError');
const InvalidDocumentTypeError = require('@dashevo/dpp/lib/errors/InvalidDocumentTypeError');
const { Isolate } = require('isolated-vm');

const IsolatedDpp = require('../../../../lib/dpp/isolation/IsolatedDpp');
const compileFileWithBrowserify = require(
  '../../../../lib/dpp/isolation/compileFileWithBrowserify',
);

// The regexp below explodes exponentially.
// On a string that contains 'x' with length above 30
// it will take at least several seconds on a modern hardware.
// It takes about 3 seconds with 29 symbols on 2019 16" MacBook Pro,
// And with 30 symbols it's already ~6 seconds, and with 31 symbols it's 12 sec
const exponentialPattern = '(x+x+)+y';
const stringThatExponentialyBlowsRegexp = 'x'.repeat(35);

describe('IsolatedDpp', function main() {
  this.timeout(20000);

  let isolateSnapshot;
  let isolatedDpp;
  let isolateOptions;
  let dataProviderMock;
  let dpp;

  let dataContract;
  let document;
  let identityCreateTransition;
  let identity;

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

    dataContract = getDataContractFixture();
    [document] = getDocumentsFixture();
    document.contractId = dataContract.getId();
    identity = getIdentityFixture();

    identityCreateTransition = getIdentityCreateSTFixture();

    const privateKey = new PrivateKey();
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
      it('should act the same way as not isolated dpp does');
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does');
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does');
    });

    describe('#createFromSerialized', () => {
      it('should pass through validation result', async () => {
        delete dataContract.contractId;

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
      it('should act the same way as not isolated dpp does');
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does');
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
      it('should act the same way as not isolated dpp does');
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does');
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
        it('should create state transition from object');
      });

      describe('DataContractStateTransition', () => {
        it('should pass through validation result');
        it('should create state transition from object');
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
      it('should act the same way as not isolated dpp does when it is valid');
      it('should act the same way as not isolated dpp does when it is not valid');
    });
  });

  it('should stop execution if dpp validation takes too much time', async () => {
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
    dataProviderMock.fetchDataContract.resolves(contract);
    const exponentialDoc = await dpp.document.create(
      contract,
      idenitity.getId(),
      'doc',
      { str: stringThatExponentialyBlowsRegexp },
    );

    // Creating document that exploits dangerous contract
    const documentSt = await dpp.document.createStateTransition([exponentialDoc]);
    documentSt.sign(identityPublicKey, privateKey);

    const st = documentSt.serialize().toString('hex');

    const start = Date.now();
    let error;
    try {
      await isolatedDpp.stateTransition.createFromSerialized(st);
    } catch (e) {
      error = e;
    }
    const end = Date.now();

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');

    expect(isolateOptions.executionOptions.timeout).to.be.equal(5000);
    expect(end - start).to.be.greaterThan(isolateOptions.executionOptions.timeout);
    expect(end - start).to.be.lessThan(isolateOptions.executionOptions.timeout + 1000);
  });
});
