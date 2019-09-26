require('dotenv-expand')(require('dotenv-safe').config());

const createServer = require('abci');

const errorHandler = require('../lib/util/errorHandler');

(async function main() {
    const app = {};

    const server = createServer(app);

    const port = process.env.PORT;
    const host = process.env.HOST;

    server.listen(port, host);
})().catch(errorHandler);
