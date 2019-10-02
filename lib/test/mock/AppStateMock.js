class AppStateMock {
  /**
   *
   * @param {Sandbox} sinon
   */
  constructor(sinon) {
    this.getHeight = sinon.stub();
    this.getAppHash = sinon.stub();
    this.getBlockHash = sinon.stub();

    this.setHeight = sinon.stub();
    this.setAppHash = sinon.stub();
    this.setBlockHash = sinon.stub();

    this.saveState = sinon.stub();
  }
}

module.exports = AppStateMock;
