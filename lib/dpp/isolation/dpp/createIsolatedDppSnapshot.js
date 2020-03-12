const { Isolate } = require('isolated-vm');

const compileDppCode = require('./compileDppCode');

async function createIsolatedDppSnapshot() {
  const dppCode = await compileDppCode();

  return Isolate.createSnapshot([
    { code: dppCode },
  ]);
}

module.exports = createIsolatedDppSnapshot;
