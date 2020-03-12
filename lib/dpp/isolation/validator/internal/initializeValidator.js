const Ajv = require('ajv');

const JsonSchemaValidator = require('@dashevo/dpp/lib/validation/JsonSchemaValidator');

const ajv = new Ajv();

module.exports = new JsonSchemaValidator(ajv);
