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
   * @param height {number}
   * @param appHash {Buffer}
   * @param size {number}
   * @returns {Promise<*>}
   */
  async saveState(height, appHash, size) {
    const state = {
      id: 'state',
      height,
      appHash,
      size,
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
   * Get last height and appHash
   * @returns {Promise<{appHash: Buffer, height: number}>}
   */
  async getState() {
    return await this.mongoCollection.findOne({ id: 'state' });
  }


}

module.exports = AppState;

