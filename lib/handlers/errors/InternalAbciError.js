const AbciError = require('./AbciError');

class InternalAbciError extends AbciError {
  /**
   *
   * @param {string} message
   * @param {*} data
   */
  constructor(message, data = undefined) {
    super(AbciError.CODES.INTERNAL, `Internal error: ${message}`, data);

    this.message = message;
  }
}

module.exports = InternalAbciError;
