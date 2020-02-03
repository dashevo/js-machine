class InvalidIdentityIdError extends Error {
  /**
   *
   * @param {*} id
   */
  constructor(id) {
    super();

    this.name = this.constructor.name;
    this.message = 'Invalid identity id';

    this.id = id;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   *
   * @return {*}
   */
  getId() {
    return this.id;
  }
}

module.exports = InvalidIdentityIdError;
