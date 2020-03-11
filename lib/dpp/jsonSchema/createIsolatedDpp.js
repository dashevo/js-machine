
const bootstrapIsolateFromSnapshot = require('./bootstrapIsolateFromSnapshot');
const IsolatedJsonSchemaValidator = require('./IsolatedJsonSchemaValidator');

async function createIsolatedDpp(dataProvider, snapshot, options) {
  const { context, isolate } = await bootstrapIsolateFromSnapshot(snapshot, options);

  try {
    const jsonSchemaValidator = new IsolatedJsonSchemaValidator(context, options.timeout);

    const dpp = new DashPlatformProtocol({
      dataProvider,
      jsonSchemaValidator,
    });
  } finally {
    if (!isolate.isDisposed) {
      isolate.dispose();
    }
  }
}

module.exports = createIsolatedDpp;
