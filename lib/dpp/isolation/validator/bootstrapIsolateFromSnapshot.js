const { Isolate } = require('isolated-vm');

async function bootstrapIsolateFromSnapshot(snapshot, options) {
  const isolate = new Isolate({
    ...options,
    snapshot,
  });

  const context = await isolate.createContext();
  const { global: jail } = context;

  await jail.set('global', jail.derefInto());

  return { context, isolate };
}

module.exports = bootstrapIsolateFromSnapshot;
