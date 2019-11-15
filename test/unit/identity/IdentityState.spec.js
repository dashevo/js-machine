const IdentityState = require('../../../lib/identity/IdentityState');

describe('IdentityState', () => {
  let identityState;
  let identityModelMock;

  beforeEach(function beforeEach() {
    identityState = new IdentityState();
    identityModelMock = this.sinon.stub();
  });

  it('should set identity', async () => {
    identityState.addIdentityModel(identityModelMock);
    identityState.addIdentityModel(identityModelMock);

    expect(identityState.identityModels).to.have.lengthOf(2);
    expect(identityState.identityModels[0]).to.deep.equal(identityModelMock);
    expect(identityState.identityModels[1]).to.deep.equal(identityModelMock);
  });

  it('should return identity', async () => {
    identityState.addIdentityModel(identityModelMock);

    const returnedIdentityModel = identityState.getIdentityModels();

    expect(returnedIdentityModel).to.deep.equal([identityModelMock]);
  });

  it('should reset identity', async () => {
    identityState.addIdentityModel(identityModelMock);

    expect(identityState.identityModels).to.have.lengthOf(1);
    expect(identityState.identityModels[0]).to.deep.equal(identityModelMock);

    identityState.reset();

    expect(identityState.identityModels).to.have.lengthOf(0);
  });
});
