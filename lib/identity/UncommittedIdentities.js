class UncommittedIdentities {
  constructor() {
    this.identities = [];
  }

  /**
   *
   * @param {Identity} identity
   */
  addIdentity(identity) {
    this.identities.push(identity);
  }

  /**
   * return {Identity[]}
   */
  getIdentities() {
    return this.identities;
  }

  /**
   * Reset data before new transition
   */
  reset() {
    this.identities = [];
  }
}

module.exports = UncommittedIdentities;
