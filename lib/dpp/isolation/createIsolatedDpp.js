const { Isolate } = require('isolated-vm');
const DashPlatformProtocol = require('@dashevo/dpp');
const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const AbstractStateTransition = require('@dashevo/dpp/lib/stateTransition/AbstractStateTransition');

const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');
const wrapDppCreateMethod = require('./wrapDppCreateMethod');
const createDppInContext = require('./createDppInContext');

const timeoutInMillis = 1000;
const memoryLimit = 128;

const defaultExecutionOptions = {
  timeout: timeoutInMillis,
  arguments: {
    copy: true,
  },
  result: {
    promise: true,
  },
};

/**
 * Creates an instance of dpp that will run in it's own virtual machine
 * Please note that to parse serialized entities you need to pass a string instead of buffer,
 * since isolates copies buffers as UInt8Array, and the current version of
 * dpp can work only with buffers.
 * Also, it will always return raw objects instead of instances
 * @param {DataProvider} dataProvider
 * @returns {Promise<{stateTransition: {createFromSerialized(string, object): Promise<Object>}}>}
 */
async function createIsolatedDpp(dataProvider) {
  // Set up isolate
  const isolate = new Isolate({
    memoryLimit,
  });
  const context = await isolate.createContext();
  const { global: jail } = context;
  await jail.set('global', jail.derefInto());

  // This will instantiate 'dpp' into the isolate
  await createDppInContext(context, dataProvider);

  const dpp = new DashPlatformProtocol({ dataProvider });

  return {
    stateTransition: {
      createFromSerialized: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromSerialized',
        jail,
        defaultExecutionOptions,
        dpp,
      ),
      createFromObject: wrapDppCreateMethod(
        'dpp.stateTransition',
        'createFromObject',
        jail,
        defaultExecutionOptions,
        dpp,
      ),
      async validateData(stateTransition, ...args) {
        let stateTransitionJson = stateTransition;

        if (stateTransition instanceof AbstractStateTransition) {
          stateTransitionJson = stateTransition.toJSON();
        }

        const res = await invokeFunctionFromIsolate(
          jail,
          'dpp.stateTransition',
          'validateData',
          [stateTransitionJson, ...args],
          defaultExecutionOptions,
        );
        const validationResult = new ValidationResult();
        return Object.assign(validationResult, res);
      },
    },
  };
}

module.exports = createIsolatedDpp;
