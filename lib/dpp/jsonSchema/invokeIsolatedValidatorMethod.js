const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');

const invokeSyncFunctionFromIsolate = require('./invokeSyncFunctionFromIsolate');

function invokeIsolatedValidatorMethod(context, methodName, args, timeout) {
  const result = invokeSyncFunctionFromIsolate(
    context,
    'jsonSchemaValidator',
    methodName,
    args,
    { timeout, arguments: { copy: true }, result: { copy: true } },
  );

  const validationResult = new ValidationResult();

  return Object.assign(validationResult, result);
}

module.exports = invokeIsolatedValidatorMethod;
