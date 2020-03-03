const { Isolate } = require('isolated-vm');
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
    await context.evalClosure(`
      global.setTimeout = function(timeout) {
        return $0.apply(undefined, [timeout], { result: { promise: true } });
      }`,
    [timeout => new Promise((resolve) => {
      setTimeout(resolve, timeout);
    })], { arguments: { reference: true } });

    await context.eval(`
      global.allocateRandomMemory = ${allocateRandomMemory}
    `);
  });

  it('should call a given function from isolate with given arguments and return a result', () => {
    throw new Error('Not implemented');
  });

  it('should stop execution after a timeout for an async function', async () => {
    const timeout = 2000;
    let error;

    const timeStart = Date.now();
    try {
      await invokeFunctionFromIsolate(
        jail,
        '',
        'wait',
        [5000],
        { timeout, arguments: { copy: true }, result: { promise: true, copy: true } },
      );
    } catch (e) {
      error = e;
    }
    const timeSpent = Date.now() - timeStart;

    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.be.equal('Script execution timed out.');
    expect(timeSpent).to.be.greaterThan(timeout);
    expect(timeSpent).to.be.lessThan(timeout + 1000);
  });

  it('should stop execution after a timeout for an async function that makes call to an external reference', async () => {
    const timeout = 2000;
    let error;

    const timeStart = Date.now();
    try {
      await invokeFunctionFromIsolate(
        jail,
        '',
        'setTimeout',
        [5000],
        { timeout, arguments: { copy: true }, result: { promise: true, copy: true } },
      );
    } catch (e) {
      error = e;
    }
    const timeSpent = Date.now() - timeStart;

    expect(timeSpent).to.be.greaterThan(timeout);
    expect(timeSpent).to.be.lessThan(timeout + 1000);
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
    expect(timeSpent).to.be.lessThan(timeout + 1000);
  });

  it('should stop execution if memory is exceeded', async () => {
    // 180 mb, while our limit is 128 mb
    const memoryToAllocate = 180 * 1000 * 1000;
    let error;

    // This invokation should be fine
    await invokeFunctionFromIsolate(
      jail,
      '',
      'allocateRandomMemory',
      // 100 mb should be fine, as the limit set in beforeEach hook is 128
      [100 * 1000 * 1000],
      { arguments: { copy: true }, result: { promise: true, copy: true } },
    );

    // This one should crash
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
