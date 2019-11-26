const level = require('level-rocksdb');
const cbor = require('cbor');

const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');

const LevelDBTransaction = require('../../../lib/levelDb/LevelDBTransaction');

const IdentityLevelDBRepository = require('../../../lib/identity/IdentityLevelDBRepository');
const InvalidIdentityIdError = require('../../../lib/identity/errors/InvalidIdentityIdError');

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
    it('should store identity', async () => {
      const repositoryInstance = await repository.store(identity);

      expect(repositoryInstance).to.equal(repository);

      const storedIdentityBuffer = await db.get(key);

      expect(storedIdentityBuffer).to.be.instanceOf(Buffer);

      const storedIdentity = cbor.decode(storedIdentityBuffer);

      expect(storedIdentity).to.deep.equal(identity.toJSON());
    });

    it('should store identity in transaction', async () => {
      const transaction = repository.createTransaction();

      expect(transaction).to.be.instanceOf(LevelDBTransaction);

      transaction.startTransaction();
      await repository.store(identity, transaction);
      await transaction.commit();

      const storedIdentityBuffer = await db.get(key);

      expect(storedIdentityBuffer).to.be.instanceOf(Buffer);

      const storedIdentity = cbor.decode(storedIdentityBuffer);

      expect(storedIdentity).to.deep.equal(identity.toJSON());
    });
  });

  describe('#fetch', () => {
    it('should return null if identity was not found', async () => {
      await repository.store(identity);

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

    it('should return stored identity with transaction', async () => {
      await repository.store(identity);

      const transaction = repository.createTransaction();
      transaction.startTransaction();

      const storedIdentity = await repository.fetch(identity.getId(), transaction);

      expect(storedIdentity.toJSON()).to.deep.equal(identity.toJSON());
    });
  });
});
