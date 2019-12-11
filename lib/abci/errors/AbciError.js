class AbciError extends Error {
  /**
   * @param {number} code
   * @param {string} message
   * @param {Object=undefined} data
   * @param {{ key: string, value: string }[]=[]} tags
   */
  constructor(code, message, data = undefined, tags = []) {
    super();

    this.name = this.constructor.name;

    this.code = code;
    this.message = message;
    this.data = data;
    this.tags = tags;

    Error.captureStackTrace(this, this.constructor);
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

  /**
   * Get tags
   *
   * @return {{ key: string, value: string }[]}
   */
  getTags() {
    return this.tags;
  }
}

AbciError.CODES = {
  INTERNAL: 1,
  INVALID_ARGUMENT: 2,
  RATE_LIMITER_QUOTA_EXCEEDED: 3,
  RATE_LIMITER_BANNED: 4,
};

module.exports = AbciError;
