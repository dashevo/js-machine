const UncommittedIdentities = require('../../../lib/identity/UncommittedIdentities');

describe('UncommittedIdentities', () => {
  let uncommittedIdentities;
  let identityMock;

  beforeEach(function beforeEach() {
    uncommittedIdentities = new UncommittedIdentities();
    identityMock = this.sinon.stub();
  });

  it('should set identity', async () => {
    uncommittedIdentities.addIdentity(identityMock);
    uncommittedIdentities.addIdentity(identityMock);

    expect(uncommittedIdentities.identities).to.have.lengthOf(2);
    expect(uncommittedIdentities.identities[0]).to.deep.equal(identityMock);
    expect(uncommittedIdentities.identities[1]).to.deep.equal(identityMock);
  });

  it('should return identity', async () => {
    uncommittedIdentities.addIdentity(identityMock);

    const returnedIdentity = uncommittedIdentities.getIdentities();

    expect(returnedIdentity).to.deep.equal([identityMock]);
  });

  it('should reset identity', async () => {
    uncommittedIdentities.addIdentity(identityMock);

    expect(uncommittedIdentities.identities).to.have.lengthOf(1);
    expect(uncommittedIdentities.identities[0]).to.deep.equal(identityMock);

    uncommittedIdentities.reset();

    expect(uncommittedIdentities.identities).to.have.lengthOf(0);
  });
});
