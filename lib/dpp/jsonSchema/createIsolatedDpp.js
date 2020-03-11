const IsolatedDashPlatformProtocol = require('./IsolatedDashPlatformProtocol');
const bootstrapIsolateFromSnapshot = require('./bootstrapIsolateFromSnapshot');
const IsolatedJsonSchemaValidator = require('./IsolatedJsonSchemaValidator');

async function createIsolatedDpp(snapshot, dataProvider, options) {
  const { context, isolate } = await bootstrapIsolateFromSnapshot(snapshot, options);

  try {
    const jsonSchemaValidator = new IsolatedJsonSchemaValidator(context, options.timeout);

    return new IsolatedDashPlatformProtocol(
      isolate,
      { dataProvider, jsonSchemaValidator },
    );
  } catch (e) {
    if (!isolate.isDisposed) {
      isolate.dispose();
    }

    throw e;
  }
}

module.exports = createIsolatedDpp;
