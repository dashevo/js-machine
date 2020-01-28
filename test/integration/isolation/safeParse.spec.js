const level = require('level-rocksdb');

const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');

const sinon = require('sinon');
const createDppMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const createSafeParse = require('../../../lib/isolation/safeParse');

const identityCreateTransitionFixture = getIdentityCreateSTFixture();
const dpp = createDppMock(sinon);

dpp.kek = 1;

dpp
  .stateTransition
  .createFromSerialized
  .resolves(identityCreateTransitionFixture);

describe('safeParse', function () {
  let db;
  this.timeout(10000);

  beforeEach(() => {
    db = level('./db/identity-test', { valueEncoding: 'binary' });
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  it('should parse state transition', async () => {
    const safeParse = createSafeParse(dpp);
    const serializedIdentityCreateST = getIdentityCreateSTFixture().serialize();

    const parsedTransition = await safeParse(serializedIdentityCreateST);

    expect(parsedTransition).to.be.deep.equal(getIdentityCreateSTFixture());
  });
});
