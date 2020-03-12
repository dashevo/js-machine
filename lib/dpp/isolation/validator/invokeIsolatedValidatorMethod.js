const ValidationResult = require('@dashevo/dpp/lib/validation/ValidationResult');
const JsonSchemaError = require('@dashevo/dpp/lib//errors/JsonSchemaError');

const invokeSyncFunctionFromIsolate = require('./invokeSyncFunctionFromIsolate');

function invokeIsolatedValidatorMethod(context, methodName, args, timeout) {
  const result = invokeSyncFunctionFromIsolate(
    context,
    'jsonSchemaValidator',
    methodName,
    args,
    { timeout, arguments: { copy: true }, result: { copy: true } },
  );

  // Restore constructor for JsonSchemaError errors
  result.errors = result.errors.map((error) => {
    const [nameAndMessage, ...stackArray] = error.stack.split('\n');
    const [name, serializedProperties] = nameAndMessage.split(': ', 2);

    if (name !== 'JsonSchemaError') {
      return error;
    }

    const errorProperties = JSON.parse(serializedProperties);

    // Restore stack
    errorProperties.stack = `${name}: ${errorProperties.originalMessage}\n${stackArray.join('\n')}`;

    // Restore original message
    errorProperties.message = errorProperties.originalMessage;
    delete errorProperties.originalMessage;

    // Create an empty instance and merge properties
    const jsonSchemaError = new JsonSchemaError(new Error());
    return Object.assign(jsonSchemaError, errorProperties);
  });

  const validationResult = new ValidationResult();

  return Object.assign(validationResult, result);
}

module.exports = invokeIsolatedValidatorMethod;
