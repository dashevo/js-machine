const { Isolate } = require('isolated-vm');

const dataContractMetaSchema = require('@dashevo/dpp/schema/meta/data-contract');

const dataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');

const compileFileWithBrowserify = require('../isolation/compileFileWithBrowserify');

async function createIsolatedValidatorSnapshot() {
  const ajvCode = await compileFileWithBrowserify(
    'ajv',
    'Ajv',
  );

  const jsonSchemaValidatorCode = await compileFileWithBrowserify(
    '@dashevo/dpp/lib/validation/JsonSchemaValidator',
    'JsonSchemaValidator',
  );

  // const isolateTimeoutShimCode = await compileFileWithBrowserify(
  //   '../internal/createTimeoutShim', 'createTimeoutShim',
  // );

  const initializeJsonSchemaValidatorCode = `
    const ajv = new Ajv();

    jsonSchemaValidator = new JsonSchemaValidator(ajv);
  `;

  const dataContractSchema = dataContractFixture().toJSON();
  const warmUpCode = `
    jsonSchemaValidator.validate(
      ${JSON.stringify(dataContractMetaSchema)},
      ${JSON.stringify(dataContractSchema)},
    );
  `;

  return Isolate.createSnapshot([
    { code: ajvCode },
    { code: jsonSchemaValidatorCode },
    { code: initializeJsonSchemaValidatorCode },
  ], warmUpCode);
}

module.exports = createIsolatedValidatorSnapshot;
