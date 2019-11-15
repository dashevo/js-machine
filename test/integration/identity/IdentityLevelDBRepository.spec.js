const level = require('level-rocksdb');
const cbor = require('cbor');

const IdentityModel = require('@dashevo/dpp/lib/identity/model/IdentityModel');

const IdentityLevelDBRepository = require('../../../lib/identity/IdentityLevelDBRepository');
const InvalidIdentityIdError = require('../../../lib/identity/errors/InvalidIdentityIdError');

describe('IdentityLevelDBRepository', () => {
  let db;
  let repository;
  let identityModel;
  let id;
  let key;

  beforeEach(() => {
    db = level('./db/identity-test', { valueEncoding: 'binary' });

    repository = new IdentityLevelDBRepository(db);

    id = 'testId';
    key = `${IdentityLevelDBRepository.KEY_NAME}:${id}`;

    identityModel = new IdentityModel({
      id,
      publicKey: 'testPublicKey',
    });
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  describe('#store', () => {
    it('should store identity', async () => {
      const repositoryInstance = await repository.store(identityModel);

      expect(repositoryInstance).to.equal(repository);

      const storedIdentityBuffer = await db.get(key);

      expect(storedIdentityBuffer).to.be.instanceOf(Buffer);

      const storedIdentity = cbor.decode(storedIdentityBuffer);

      expect(storedIdentity).to.deep.equal(identityModel.toJSON());
    });
  });

  describe('#fetch', () => {
    it('should return null if identity was not found', async () => {
      await repository.store(identityModel);

      const storedState = await repository.fetch('nonExistingId');

      expect(storedState).to.be.null();
    });

    it('should return stored identity', async () => {
      const identityBufferToStore = cbor.encode(identityModel.toJSON());

      await db.put(key, identityBufferToStore);

      const storedIdentityBuffer = await repository.fetch(id);
      expect(storedIdentityBuffer).to.be.instanceOf(Buffer);

      const storedIdentity = cbor.decode(storedIdentityBuffer);

      expect(storedIdentity).to.deep.equal(identityModel.toJSON());
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
  });
});
