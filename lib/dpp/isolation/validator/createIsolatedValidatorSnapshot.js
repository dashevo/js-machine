const { Isolate } = require('isolated-vm');

const dataContractMetaSchema = require('@dashevo/dpp/schema/meta/data-contract');

const dataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');

const compileJsonSchemaValidatorCode = require('./compileJsonSchemaValidatorCode');

async function createIsolatedValidatorSnapshot() {
  const jsonSchemaValidatorCode = await compileJsonSchemaValidatorCode();

  const dataContractSchema = dataContractFixture().toJSON();
  const warmUpCode = `
    jsonSchemaValidator.validate(
      ${JSON.stringify(dataContractMetaSchema)},
      ${JSON.stringify(dataContractSchema)},
    );
  `;

  return Isolate.createSnapshot([
    { code: jsonSchemaValidatorCode },
  ], warmUpCode);
}

module.exports = createIsolatedValidatorSnapshot;
