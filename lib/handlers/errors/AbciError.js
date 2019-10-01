class AbciError extends Error {
  /**
   * @param {number} code
   * @param {string} message
   * @param {Error} data
   */
  constructor(code, message, data = undefined) {
    super(message);

    this.code = code;

    if (data) {
      this.data = data;
    }
  }

  /**
   * Get message
   *
   * @return {string}
   */
  getMessage() {
    return this.message;
  }

  /**
   * Get error code
   *
   * @return {number}
   */
  getCode() {
    return this.code;
  }

  /**
   * Get data
   *
   * @return {Object}
   */
  getData() {
    return this.data;
  }
}

AbciError.CODES = {
  COMMON: 1,
  INTERNAL: 2,
  INVALID_ARGUMENT: 3,
};

module.exports = AbciError;
