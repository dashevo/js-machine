const IdentityState = require('../../../lib/identity/IdentityState');

describe('IdentityState', () => {
  let identityState;
  let identityModelMock;

  beforeEach(function beforeEach() {
    identityState = new IdentityState();
    identityModelMock = this.sinon.stub();
  });

  it('should set identity', async () => {
    identityState.setIdentityModel(identityModelMock);

    expect(identityState.identityModel).to.deep.equal(identityModelMock);
  });

  it('should return identity', async () => {
    identityState.setIdentityModel(identityModelMock);

    const returnedIdentityModel = identityState.getIdentityModel();

    expect(returnedIdentityModel).to.deep.equal(identityModelMock);
  });

  it('should reset identity', async () => {
    identityState.setIdentityModel(identityModelMock);

    expect(identityState.identityModel).to.deep.equal(identityModelMock);

    identityState.reset();

    expect(identityState.identityModel).to.be.null();
  });
});
