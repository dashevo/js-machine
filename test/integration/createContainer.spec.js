const createDIContainer = require('../../lib/createDIContainer');

describe('createDIContainer', () => {
  it('should create DI container', () => {
    const container = createDIContainer(process.env);

    expect(container).to.respondTo('register');
    expect(container).to.respondTo('resolve');
  });

  describe('container', () => {
    let container;

    beforeEach(() => {
      container = createDIContainer(process.env);
    });

    it('should resolve abciHandlers', () => {
      const abciHandlers = container.resolve('abciHandlers');

      expect(abciHandlers).to.have.property('info');
      expect(abciHandlers).to.have.property('checkTx');
      expect(abciHandlers).to.have.property('blockBegin');
      expect(abciHandlers).to.have.property('deliverTx');
      expect(abciHandlers).to.have.property('commit');
    });
  });
});
