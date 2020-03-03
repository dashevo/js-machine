const invokeFunctionFromIsolate = require('./invokeFunctionFromIsolate');

const dppErrors = [];

function wrapDppCreateMethod(objectPath, methodName, jail, executionOptions, dpp) {
  return async function dppCreateMethod(...args) {
    const rawStReference = await invokeFunctionFromIsolate(
      jail,
      objectPath,
      methodName,
      args,
      executionOptions,
    );

    const stJson = await rawStReference
      .getSync('toJSON')
      .apply(
        rawStReference.derefInto(),
        [],
        { ...executionOptions, ...{ result: { copy: true } } },
      );

    try {
      return dpp.stateTransition.createStateTransition(stJson);
    } catch (e) {
      if (dppErrors.includes(e.name)) {

      }
      throw e;
    }
  };
}

module.exports = wrapDppCreateMethod;
