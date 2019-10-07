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
      fetchContract: this.sinon.stub(),
    };

    dataProvider = new DataProvider(driveApiClientMock, contractCacheMock);
  });

  describe('#fetchContract', () => {
    it('should fetch contract from cache', async () => {
      contractCacheMock.get.returns(contract);

      const actualContract = await dataProvider.fetchContract(contractId);

      expect(actualContract).to.equal(contract);

      expect(contractCacheMock.get).to.be.calledOnceWith(contractId);
      expect(driveApiClientMock.fetchContract).to.not.be.called();
    });

    it('should fetch contract from drive if it is not present in cache', async () => {
      driveApiClientMock.fetchContract.resolves(contract);

      const actualContract = await dataProvider.fetchContract(contractId);

      expect(actualContract).to.equal(contract);

      expect(contractCacheMock.get).to.be.calledOnceWith(contractId);
      expect(driveApiClientMock.fetchContract).to.be.calledOnceWith(contractId);
      expect(contractCacheMock.set).to.be.calledOnceWith(contractId, contract);
    });
  });
});
