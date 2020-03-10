const bootstrapIsolateFactory = require('./bootstrapIsolateFactory');

const wrapDppCreateMethod = require('./wrapDppCreateMethod');
const wrapDppValidateMethod = require('./wrapDppValidateMethod');

class IsolatedDpp {
  /**
   * @param {DashPlatformProtocol} dpp
   * @param {ExternalCopy<ArrayBuffer>} snapshot
   * @param {{ isolateOptions: Object, executionOptions: Object }} options
   */
  constructor(dpp, snapshot, options) {
    this.dpp = dpp;
    this.options = options;

    this.bootstrapIsolate = bootstrapIsolateFactory(
      dpp,
      snapshot,
      options.isolateOptions,
    );

    this.initializeStateTransitionFacade();
  }

  /**
   * Init `dpp.stateTransition` facade
   */
  initializeStateTransitionFacade() {
    this.stateTransition = {
      validateData: wrapDppValidateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'validateData',
        this.options.executionOptions,
      ),
      createFromSerialized: wrapDppCreateMethod(
        this.bootstrapIsolate,
        'dpp.stateTransition',
        'createFromSerialized',
        this.options.executionOptions,
        this.dpp,
        'stateTransition',
      ),
    };
  }
}

module.exports = IsolatedDpp;
