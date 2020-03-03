const sinon = require('sinon');
const { Reference } = require('isolated-vm');
const { Transaction } = require('@dashevo/dashcore-lib');
const Document = require('@dashevo/dpp/lib/document/Document');
const DashPlatformProtocol = require('@dashevo/dpp');
const IdentityPublicKey = require('@dashevo/dpp/lib/identity/IdentityPublicKey');
const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const { PrivateKey } = require('@dashevo/dashcore-lib');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const createDppMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const getIdentityStateTransitionFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');
const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const createIsolatedDpp = require('../../../../lib/dpp/isolation/createIsolatedDpp');

const IsolatedDataProviderWrapper = require('../../../../lib/dpp/isolation/IsolatedDataProviderWrapper');

describe('IsolatedDpp', function () {
  let dataProviderMock;
  let dataProviderMockReference;
  let dataProviderWrapper;
  let dataContractFixture;
  let identitySTFixture;
  let transactionFixture;
  let dppMock;
  let isolatedDpp;
  let privateKey;
  let dpp;
  this.timeout(100000);

  beforeEach(async () => {
    dataProviderMock = createDataProviderMock(sinon);
    dataProviderMockReference = new Reference(dataProviderMock);
    dataProviderWrapper = new IsolatedDataProviderWrapper(dataProviderMockReference);
    dataContractFixture = getDataContractFixture();
    identitySTFixture = getIdentityStateTransitionFixture();
    privateKey = new PrivateKey();
    identitySTFixture.publicKeys = [new IdentityPublicKey({
      id: 1,
      type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
      data: privateKey.toPublicKey().toBuffer().toString('base64'),
      isEnabled: true,
    })];
    identitySTFixture.sign(identitySTFixture.getPublicKeys()[0], privateKey);
    dppMock = createDppMock(sinon);
    isolatedDpp = await createIsolatedDpp(dataProviderMock, 128, 5000);
    dpp = new DashPlatformProtocol({ dataProvider: dataProviderMock });
    transactionFixture = new Transaction('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000');
  });

  describe('stateTransition', () => {
    describe('createFromSerialized', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const serialized = identitySTFixture.serialize();
        let actualSt = await isolatedDpp.stateTransition.createFromSerialized(serialized);

        expect(serialized).to.be.instanceOf(Buffer);
        expect(actualSt).to.be.deep.equal(identitySTFixture);

        actualSt = await isolatedDpp.stateTransition.createFromSerialized(serialized.toString('hex'));

        expect(actualSt).to.be.deep.equal(identitySTFixture);
      });
    });
    describe('createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        const json = identitySTFixture.toJSON();
        const actualSt = await isolatedDpp.stateTransition.createFromObject(json);

        expect(actualSt).to.be.deep.equal(identitySTFixture);
      });
    });
    describe('validate', () => {
      it('should act the same way as not isolated dpp does when it is valid', async () => {
        const expectedValidationResult = await dpp.stateTransition.validate(identitySTFixture);
        const actualValidationResult = await isolatedDpp.stateTransition.validate(
          identitySTFixture,
        );

        expect(actualValidationResult.isValid()).to.be.true();
        expect(actualValidationResult).to.be.deep.equal(expectedValidationResult);
      });
      it('should act the same way as not isolated dpp does when it is not valid', async () => {
        const expectedValidationResult = await dpp.stateTransition.validate(
          getIdentityStateTransitionFixture(),
        );
        const actualValidationResult = await isolatedDpp.stateTransition.validate(
          getIdentityStateTransitionFixture(),
        );

        expect(expectedValidationResult.isValid()).to.be.false();
        expect(actualValidationResult).to.be.deep.equal(expectedValidationResult);
      });
    });
  });

  describe('document', () => {
    describe('create', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('createFromSerialized', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('validate', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
  });

  describe('dataContract', () => {
    describe('create', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('createFromSerialized', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('validate', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
  });

  describe('identity', () => {
    describe('create', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('createFromSerialized', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('createFromObject', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
    describe('validate', () => {
      it('should act the same way as not isolated dpp does', async () => {
        throw new Error('Not implemented');
      });
    });
  });
});
