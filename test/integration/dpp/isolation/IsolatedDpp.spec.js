const { Isolate } = require('isolated-vm');

const DashPlatformProtocol = require('@dashevo/dpp');
const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getIdentityCreateSTFixture = require(
  '@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture',
);

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
  this.timeout(10000);

  let isolateSnapshot;
  let isolatedDpp;
  let isolateOptions;
  let dataProviderMock;
  let dpp;

  let dataContract;
  let document;
  let stateTransition;
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
    stateTransition = getIdentityCreateSTFixture();

    dataProviderMock = createDataProviderMock(this.sinon);
    dataProviderMock.fetchDataContract.returns(dataContract);

    dpp = new DashPlatformProtocol({ dataProvider: dataProviderMock });

    isolatedDpp = new IsolatedDpp(dpp, isolateSnapshot, isolateOptions);
  });

  describe('dataContract', () => {
    describe('#create', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
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
        throw new Error('Not implemented');
      });
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
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
        throw new Error('Not implemented');
      });
    });

    describe('#createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
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
      it('should pass through validation result', async () => {
        delete stateTransition.lockedOutPoint;

        try {
          await isolatedDpp.stateTransition.createFromSerialized(
            stateTransition.serialize(),
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
          stateTransition.serialize(),
        );
        expect(result.toJSON()).to.deep.equal(dataContract.toJSON());
      });
    });

    describe('createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const result = await isolatedDpp.stateTransition.createFromObject(
          stateTransition.toJSON(),
        );

        expect(result).to.be.deep.equal(stateTransition.toJSON());
      });
    });

    describe('#validate', () => {
      it('should act the same way as not isolated dpp does when it is valid', async () => {
        throw new Error('Not implemented');
      });

      it('should act the same way as not isolated dpp does when it is not valid', async () => {
        throw new Error('Not implemented');
      });
    });
  });

  it('should stop execution if dpp validation takes too much memory', async () => {
    throw new Error('Not implemented');
  });

  it('should stop execution if dpp validation takes too much time', async () => {
    throw new Error('Not implemented');
  });
});
