const DataProvider = require('../../../lib/dpp/DataProvider');

describe('DataProvider', () => {
  let contract;
  let contractId;
  let dataProvider;
  let contractCacheMock;
  let driveApiClientMock;

  beforeEach(function beforeEach() {
    contractId = '123';
    contract = {};

    contractCacheMock = {
      set: this.sinon.stub(),
      get: this.sinon.stub(),
    };

    driveApiClientMock = {
      request: this.sinon.stub(),
    };

    dataProvider = new DataProvider(driveApiClientMock, contractCacheMock);
  });

  describe('#fetchDataContract', () => {
    it('should fetch contract from cache', async () => {
      contractCacheMock.get.returns(contract);

      const actualContract = await dataProvider.fetchDataContract(contractId);

      expect(actualContract).to.equal(contract);

      expect(contractCacheMock.get).to.be.calledOnceWith(contractId);
      expect(driveApiClientMock.request).to.not.be.called();
    });

    it('should fetch contract from drive if it is not present in cache', async () => {
      driveApiClientMock.request.resolves({ result: contract });

      const actualContract = await dataProvider.fetchDataContract(contractId);

      expect(actualContract).to.equal(contract);

      expect(contractCacheMock.get).to.be.calledOnceWith(contractId);
      expect(driveApiClientMock.request).to.be.calledOnceWithExactly('fetchContract', { contractId });
      expect(contractCacheMock.set).to.be.calledOnceWith(contractId, contract);
    });
  });
});