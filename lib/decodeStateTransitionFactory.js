const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const InvalidArgumentAbciError = require('./abci/errors/InvalidArgumentAbciError');


/**
 * @param {DashPlatformProtocol} dpp
 * @return {decodeStateTransition}
 */
function decodeStateTransitionFactory(dpp) {
  /**
   * @typedef decodeStateTransition
   *
   * @param {Uint8Array} rawData
   * @return {DataContractStateTransition|DocumentsStateTransition}
   */
  async function decodeStateTransition(rawData) {
    if (!rawData) {
      throw new InvalidArgumentAbciError('stateTransition is not specified');
    }

    let stateTransition;
    try {
      stateTransition = await dpp.stateTransition.createFromSerialized(Buffer.from(rawData));
    } catch (e) {
      if (e instanceof InvalidStateTransitionError) {
        throw new InvalidArgumentAbciError('stateTransition is invalid', { errors: e.getErrors() });
      }

      throw e;
    }

    return stateTransition;
  }

  return decodeStateTransition;
}

module.exports = decodeStateTransitionFactory;
