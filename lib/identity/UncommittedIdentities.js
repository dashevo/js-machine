class UncommittedIdentities {
  constructor() {
    this.identityModels = [];
  }

  /**
   *
   * @param {IdentityModel} identityModel
   */
  addIdentityModel(identityModel) {
    this.identityModels.push(identityModel);
  }

  /**
   * return {IdentityModel[]}
   */
  getIdentityModels() {
    return this.identityModels;
  }

  /**
   * Reset data before new transition
   */
  reset() {
    this.identityModels = [];
  }
}

module.exports = UncommittedIdentities;
