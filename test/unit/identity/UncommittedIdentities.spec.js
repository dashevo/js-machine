const UncommittedIdentities = require('../../../lib/identity/UncommittedIdentities');

describe('UncommittedIdentities', () => {
  let uncommittedIdentities;
  let identityModelMock;

  beforeEach(function beforeEach() {
    uncommittedIdentities = new UncommittedIdentities();
    identityModelMock = this.sinon.stub();
  });

  it('should set identity', async () => {
    uncommittedIdentities.addIdentityModel(identityModelMock);
    uncommittedIdentities.addIdentityModel(identityModelMock);

    expect(uncommittedIdentities.identityModels).to.have.lengthOf(2);
    expect(uncommittedIdentities.identityModels[0]).to.deep.equal(identityModelMock);
    expect(uncommittedIdentities.identityModels[1]).to.deep.equal(identityModelMock);
  });

  it('should return identity', async () => {
    uncommittedIdentities.addIdentityModel(identityModelMock);

    const returnedIdentityModel = uncommittedIdentities.getIdentityModels();

    expect(returnedIdentityModel).to.deep.equal([identityModelMock]);
  });

  it('should reset identity', async () => {
    uncommittedIdentities.addIdentityModel(identityModelMock);

    expect(uncommittedIdentities.identityModels).to.have.lengthOf(1);
    expect(uncommittedIdentities.identityModels[0]).to.deep.equal(identityModelMock);

    uncommittedIdentities.reset();

    expect(uncommittedIdentities.identityModels).to.have.lengthOf(0);
  });
});
