class IdentityState {
  constructor() {
    this.identityModel = null;
  }

  /**
   *
   * @param {IdentityModel} identityModel
   */
  setIdentityModel(identityModel) {
    this.identityModel = identityModel;
  }

  /**
   * return {IdentityModel}
   */
  getIdentityModel() {
    return this.identityModel;
  }

  /**
   * Reset data before new transition
   */
  reset() {
    this.identityModel = null;
  }
}

module.exports = IdentityState;
