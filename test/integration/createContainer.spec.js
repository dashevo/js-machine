const createDIContainer = require('../../lib/createDIContainer');

describe('createDIContainer', function describeContainer() {
  this.timeout(10000);

  it('should create DI container', async () => {
    const container = await createDIContainer(process.env);

    expect(container).to.respondTo('register');
    expect(container).to.respondTo('resolve');

    await container.dispose();
  });

  describe('container', () => {
    let container;

    beforeEach(async () => {
      container = await createDIContainer(process.env);
    });

    afterEach(async () => {
      await container.dispose();
    });

    it('should resolve abciHandlers', () => {
      const abciHandlers = container.resolve('abciHandlers');

      expect(abciHandlers).to.have.property('info');
      expect(abciHandlers).to.have.property('checkTx');
      expect(abciHandlers).to.have.property('beginBlock');
      expect(abciHandlers).to.have.property('deliverTx');
      expect(abciHandlers).to.have.property('commit');
      expect(abciHandlers).to.have.property('query');
    });
  });
});
