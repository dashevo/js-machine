const { Isolate } = require('isolated-vm');

function createIsolatedModule() {
  const isolate = new Isolate({
    memoryLimit: 16,
  });

  return isolate;
}

module.exports = createIsolatedModule;
