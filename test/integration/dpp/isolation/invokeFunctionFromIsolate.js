const sinon = require('sinon');
const { Reference, Isolate } = require('isolated-vm');
const wait = require('@dashevo/dpp/lib/test/utils/wait');
const allocateRandomMemory = require('../../../../lib/test/util/allocateRandomMemory');
const waitShim = require('../../../../lib/test/util/setTimeoutShim');

const invokeFunctionFromIsolate = require('../../../../lib/dpp/isolation/invokeFunctionFromIsolate');

describe('invokeFunctionFromIsolate', function () {
  let isolate;
  let context;
  let jail;

  this.timeout(100000);

  beforeEach(async () => {
    isolate = new Isolate({ memoryLimit: 128 });
    context = await isolate.createContext();
    ({ global: jail } = context);
    await jail.set('global', jail.derefInto());
    // await context.evalClosure(`
    //   const externalWaitReference = $0;
    //   global.wait = async function(timeout) {
    //     log('timeout in isolate', timeout);
    //     await externalWaitReference.apply(null, [ timeout ], { arguments: { copy: true }, result: { promise: true } });
    //     log('waited');
    //     return 123;
    //   }
    // `,
    // [wait],
    // { arguments: { reference: true } });
    await context.eval(`global.wait = ${waitShim}`);
    await context.evalClosure(`
      global.log = function(...args) {
        $0.applyIgnored(undefined, args, { arguments: { copy: true } });
      }`,
    [console.log], { arguments: { reference: true } });
    await context.eval(`
      global.infiniteLoop = function infiniteLoop() {
        while(true) {}
        return;
      };
    `);

    await context.eval(`
      global.allocateRandomMemory = ${allocateRandomMemory}
    `);
  });

  it('should call a given function from isolate with given arguments and return a result', () => {

  });

  it('should stop execution after a timeout for an async function that makes call to an external reference', async () => {
    const timeout = 2000;
    let error;

    console.log('CPU time:', (isolate.cpuTime[0] + isolate.cpuTime[1] / 1000 / 1000), 'seconds');
    console.log('Wall time', (isolate.wallTime[0] + isolate.wallTime[1] / 1000 / 1000), 'seconds');

    const timeStart = Date.now();
    try {
      await invokeFunctionFromIsolate(
        jail,
        '',
        'wait',
        [10000],
        { timeout, arguments: { copy: true }, result: { promise: true, copy: true } },
      );
    } catch (e) {
      error = e;
    }
    const timeSpent = Date.now() - timeStart;

    console.log('CPU time:', (isolate.cpuTime[0] + isolate.cpuTime[1] / 1000 / 1000), 'seconds');
    console.log('Wall time', (isolate.wallTime[0] + isolate.wallTime[1] / 1000 / 1000), 'seconds');

    console.log('timeSpent:', timeSpent, 'milliseconds');

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');
  });

  it('should stop execution after a timeout for a sync function running inside the isolate', async () => {
    const timeout = 2000;
    const timeStart = Date.now();
    let error;

    try {
      await invokeFunctionFromIsolate(
        jail,
        '',
        'infiniteLoop',
        [],
        { timeout, arguments: { copy: true }, result: { promise: true, copy: true } },
      );
    } catch (e) {
      error = e;
    }
    const timeSpent = Date.now() - timeStart;

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');
    expect(timeSpent).to.be.greaterThan(timeout);
    expect(timeSpent).to.be.lessThanOrEqual(timeout + 1000);
  });

  it('should stop execution if memory is exceeded', async () => {
    // 180 mb, while our limit is 128 mb
    const memoryToAllocate = 180 * 1000 * 1000;
    let error;

    await invokeFunctionFromIsolate(
      jail,
      '',
      'allocateRandomMemory',
      // 100 mb should be fine, as the limit set in beforeEach hook is 128
      [100 * 1000 * 1000],
      { arguments: { copy: true }, result: { promise: true, copy: true } },
    );

    try {
      await invokeFunctionFromIsolate(
        jail,
        '',
        'allocateRandomMemory',
        [memoryToAllocate],
        { arguments: { copy: true }, result: { promise: true, copy: true } },
      );
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Isolate was disposed during execution due to memory limit');
  });
});
