const createDIContainer = require('../../lib/createDIContainer');

describe('createDIContainer', () => {
  it('should create DI container', async () => {
    const container = await createDIContainer(process.env);

    expect(container).to.respondTo('register');
    expect(container).to.respondTo('resolve');

    const db = container.resolve('stateLevelDB');
    await db.close();
  });

  describe('container', () => {
    let container;

    beforeEach(async () => {
      container = await createDIContainer(process.env);
    });

    afterEach(async () => {
      const db = container.resolve('stateLevelDB');
      await db.close();
    });

    it('should resolve abciHandlers', () => {
      const abciHandlers = container.resolve('abciHandlers');

      expect(abciHandlers).to.have.property('info');
      expect(abciHandlers).to.have.property('checkTx');
      expect(abciHandlers).to.have.property('beginBlock');
      expect(abciHandlers).to.have.property('deliverTx');
      expect(abciHandlers).to.have.property('commit');
    });
  });
});
