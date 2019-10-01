/**
 * Store application state between restarts
 */
class AppState {
  /**
   *
   * @param {Db} mongoDatabase
   */
  constructor(mongoDatabase) {
    this.collectionName = this.getCollectionName();
    this.mongoCollection = mongoDatabase.collection(this.collectionName);
    this.height = 0;
    this.appHash = null;
    this.blockHash = '';
  }

  /**
   * Collection name for MongoDB
   * @returns {string}
   */
  getCollectionName() {
    return 'state';
  }

  /**
   * Store height and appHash on every block
   * @returns {Promise<*>}
   */
  async saveState() {
    const state = {
      id: 'state',
      height: this.height,
      appHash: this.appHash,
    };
    const updateOptions = { upsert: true };
    const update = { $set: { state } };
    const filter = {
      id: 'state',
    };

    return this.mongoCollection.updateOne(
      filter,
      update,
      updateOptions,
    );
  }

  /**
   * Get previous values from MongoDB
   * @returns {Promise<void>}
   */
  async init() {
    const state = await this.mongoCollection.findOne({ id: 'state' });
    this.height = state.height || 0;
    this.appHash = state.appHash || null;
  }

  /**
   *
   * @returns {number}
   */
  getHeight() {
    return this.height;
  }

  /**
   *
   * @returns {Buffer}
   */
  getAppHash() {
    return this.appHash;
  }

  /**
   *
   * @param {number} height
   */
  setHeight(height) {
    this.height = height;
  }

  /**
   *
   * @param {Buffer} appHash
   */
  setAppHash(appHash) {
    this.appHash = appHash;
  }

  /**
   *
   * @param {string} hash
   */
  setBlockHash(hash) {
    this.blockHash = hash;
  }

  /**
   *
   * @returns {string}
   */
  getBlockHash() {
    return this.blockHash;
  }
}

module.exports = AppState;
