const sinon = require('sinon');
const { Reference } = require('isolated-vm');
const { Transaction } = require('@dashevo/dashcore-lib');
const Document = require('@dashevo/dpp/lib/document/Document');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const createDppMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');

const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const IsolatedDataProviderWrapper = require('../../../../lib/dpp/isolation/IsolatedDataProviderWrapper');

describe('IsolatedDpp', function () {
  let dataProviderMock;
  let dataProviderMockReference;
  let dataProviderWrapper;
  let dataContractFixture;
  let identityFixture;
  let transactionFixture;
  let dppMock;
  let isolatedDpp;
  this.timeout(100000);

  beforeEach(() => {
    dataProviderMock = createDataProviderMock(sinon);
    dataProviderMockReference = new Reference(dataProviderMock);
    dataProviderWrapper = new IsolatedDataProviderWrapper(dataProviderMockReference);
    dataContractFixture = getDataContractFixture();
    identityFixture = getIdentityFixture();
    dppMock = createDppMock(sinon);
    isolatedDpp =
    transactionFixture = new Transaction('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000');
  });

  describe('stateTransition', () => {
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
