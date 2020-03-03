const { Isolate } = require('isolated-vm');
const DashPlatformProtocol = require('@dashevo/dpp');

const compileFile = require('./compileFileWithBrowserify');
const IsolatedDpp = require('./IsolatedDpp');

const defaultExecutionOptions = {
  timeout: 1000,
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
 * @param {number} memoryLimit - memory limit for this isolate in megabytes
 * @param {number} timeout - maximum time to allow script execution in the isolate
 * @returns {DashPlatformProtocol}
 */
async function createIsolatedDpp(dataProvider, memoryLimit, timeout) {
  const executionOptions = { ...defaultExecutionOptions, timeout };

  const dpp = new DashPlatformProtocol({ dataProvider });

  const bootstrapDataProviderCode = await compileFile('./bootstrapDataProviderWrapper', 'bootstrapDataProvider');
  const bootstrapDppCode = await compileFile('./bootstrapDpp', 'bootstrapDpp');
  const bootstrapTimeoutShim = await compileFile('./bootstrapTimeoutShim', 'bootstrapTimeoutShim');
  const isolateSnapshot = await Isolate.createSnapshot([
    { code: bootstrapDataProviderCode },
    { code: bootstrapDppCode },
    { code: bootstrapTimeoutShim },
  ]);

  const isolateOptions = { memoryLimit };

  return new IsolatedDpp(executionOptions, dpp, isolateSnapshot, dataProvider, isolateOptions);
}

module.exports = createIsolatedDpp;
