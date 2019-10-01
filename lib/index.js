require('dotenv-expand')(require('dotenv-safe').config());

const createServer = require('abci');

const JsMachineAbciApp = require('./app/JsMachineAbciApp');
const JsMachineAbciAppOptions = require('./app/JsMachineAbciAppOptions');

const errorHandler = require('../lib/util/errorHandler');

(async function main() {
    const jsMachineAbciAppOptions = new JsMachineAbciAppOptions(process.env);

    const app = new JsMachineAbciApp(jsMachineAbciAppOptions);
    await app.init();

    const server = createServer(app.createHandlers());

    server.listen(jsMachineAbciAppOptions.getAbciServerPort(), jsMachineAbciAppOptions.getAbciServerHost());
})().catch(errorHandler);
