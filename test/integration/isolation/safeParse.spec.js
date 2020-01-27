const level = require('level-rocksdb');
const cbor = require('cbor');

const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');
const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const IdentityLevelDBRepository = require('../../../lib/identity/IdentityLevelDBRepository');
const createSafeParse = require('../../../lib/isolation/safeParse');

function initDppMock() {
  const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
  const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
}

describe('safeParse', () => {
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

  it('should store identity', async () => {
    const safeParse = createSafeParse(`${initDppMock}`);
    const identityCreateST = getIdentityCreateSTFixture();

    const parsedTransition = safeParse(identityCreateST);

    throw new Error('Not implemented');
  });
});
