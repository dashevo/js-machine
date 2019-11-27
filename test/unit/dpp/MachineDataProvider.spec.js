const MachineDataProvider = require('../../../lib/dpp/MachineDataProvider');

describe('DataProvider', () => {
  let contract;
  let contractId;
  let dataProvider;
  let contractCacheMock;
  let driveApiClientMock;
  let identityRepositoryMock;
  let blockExecutionDBTransactionsMock;
  let identity;
  let identityTransaction;

  beforeEach(function beforeEach() {
    contractId = '123';
    contract = {};
    identity = 'identity';
    identityTransaction = 'identityTransaction';

    contractCacheMock = {
      set: this.sinon.stub(),
      get: this.sinon.stub(),
    };

    driveApiClientMock = {
      fetchContract: this.sinon.stub(),
    };

    identityRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    blockExecutionDBTransactionsMock = {
      getIdentityTransaction: this.sinon.stub().returns(identityTransaction),
    };

    dataProvider = new MachineDataProvider(
      driveApiClientMock,
      contractCacheMock,
      identityRepositoryMock,
      blockExecutionDBTransactionsMock,
    );
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

  describe('#fetchIdentity', () => {
    it('should fetch identity from repository', async () => {
      const id = 'id';
      identityRepositoryMock.fetch.resolves(identity);

      const result = await dataProvider.fetchIdentity(id);

      expect(result).to.equal(identity);
      expect(blockExecutionDBTransactionsMock.getIdentityTransaction).to.be.calledOnce();

      expect(identityRepositoryMock.fetch).to.be.calledOnceWithExactly(id, identityTransaction);
    });
  });
});
