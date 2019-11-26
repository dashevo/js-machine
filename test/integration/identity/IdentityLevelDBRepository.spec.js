const level = require('level-rocksdb');
const cbor = require('cbor');

const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');

const IdentityLevelDBRepository = require('../../../lib/identity/IdentityLevelDBRepository');
const InvalidIdentityIdError = require('../../../lib/identity/errors/InvalidIdentityIdError');
const LevelDBTransactionIsNotStartedError = require('../../../lib/identity/errors/LevelDBTransactionIsNotStartedError');
const LevelDBTransactionIsAlreadyStartedError = require('../../../lib/identity/errors/LevelDBTransactionIsAlreadyStartedError');

describe('IdentityLevelDBRepository', () => {
  let db;
  let repository;
  let identity;
  let key;
  let dppMock;

  beforeEach(function beforeEach() {
    db = level('./db/identity-test', { valueEncoding: 'binary' });

    identity = getIdentityFixture();

    dppMock = createDPPMock(this.sinon);
    dppMock
      .identity
      .createFromSerialized
      .resolves(identity);

    repository = new IdentityLevelDBRepository(db, dppMock);

    key = `${IdentityLevelDBRepository.KEY_NAME}:${identity.getId()}`;
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  describe('#store', () => {
    it('should store identity in transaction', async () => {
      const repositoryInstance = await repository
        .startTransaction()
        .store(identity);

      expect(repositoryInstance).to.equal(repository);

      await repository.commit();

      const storedIdentityBuffer = await db.get(key);

      expect(storedIdentityBuffer).to.be.instanceOf(Buffer);

      const storedIdentity = cbor.decode(storedIdentityBuffer);

      expect(storedIdentity).to.deep.equal(identity.toJSON());
    });
  });

  describe('#fetch', () => {
    it('should return null if identity was not found', async () => {
      repository.startTransaction();
      await repository.store(identity);
      await repository.commit();

      const storedIdentity = await repository.fetch('nonExistingId');

      expect(storedIdentity).to.be.null();
    });

    it('should return stored identity', async () => {
      await db.put(key, identity.serialize());

      const storedIdentity = await repository.fetch(identity.getId());

      expect(storedIdentity.toJSON()).to.deep.equal(identity.toJSON());
    });

    it('should throw InvalidIdentityIdError if id is not defined', async () => {
      try {
        await repository.fetch(null);

        expect.fail('Should throw InvalidIdentityIdError');
      } catch (e) {
        expect(e).to.be.instanceOf(InvalidIdentityIdError);
        expect(e.getId()).to.be.null();
      }
    });

    it('should throw InvalidIdentityIdError if id is not a string', async () => {
      try {
        await repository.fetch({});

        expect.fail('Should throw InvalidIdentityIdError');
      } catch (e) {
        expect(e).to.be.instanceOf(InvalidIdentityIdError);
        expect(e.getId()).to.deep.equal({});
      }
    });

    it('should not return uncommitted data on fetch without transaction', async () => {
      repository.startTransaction();
      await repository.store(identity);

      const storedIdentity = await repository.fetch(identity.getId());

      expect(storedIdentity).to.be.null();
    });

    it('should return uncommitted data on fetch with transaction', async () => {
      repository.startTransaction();
      await repository.store(identity);

      const storedIdentity = await repository.fetch(identity.getId(), true);

      expect(storedIdentity.toJSON()).to.deep.equal(identity.toJSON());
    });
  });

  describe('transaction', () => {
    it('should fail if transaction was started twice', async () => {
      repository.startTransaction();

      try {
        repository.startTransaction();

        expect.fail('Should throw an LevelDBTransactionIsAlreadyStartedError error');
      } catch (e) {
        expect(e).to.be.instanceOf(LevelDBTransactionIsAlreadyStartedError);
      }
    });

    it('should fail on fetch with transaction if transaction is not started', async () => {
      try {
        await repository.fetch(identity.getId(), true);

        expect.fail('Should throw an LevelDBTransactionIsNotStartedError error');
      } catch (e) {
        expect(e).to.be.instanceOf(LevelDBTransactionIsNotStartedError);
      }
    });

    it('should fail on store if transaction is not started', async () => {
      try {
        await repository.store(identity);

        expect.fail('Should throw an LevelDBTransactionIsNotStartedError error');
      } catch (e) {
        expect(e).to.be.instanceOf(LevelDBTransactionIsNotStartedError);
      }
    });

    it('should fail on commit if transaction is not started', async () => {
      try {
        await repository.commit();

        expect.fail('Should throw an LevelDBTransactionIsNotStartedError error');
      } catch (e) {
        expect(e).to.be.instanceOf(LevelDBTransactionIsNotStartedError);
      }
    });
  });
});
