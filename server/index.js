"use strict";

const { createServer } = require("http");

const page = require("../.next/serverless/pages/index.js");

const DEFAULT_PORT = 3000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";

// Create the server app.
const app = createServer((req, res) => page.render(req, res));

// TODO: IMPLEMENT
// LAMBDA: Export handler for lambda use.
let handler;
module.exports.handler = async (event, context) => {
  // Lazy require to allow non-Lambda targets to omit.
  // eslint-disable-next-line global-require
  const nextToLambda = require("next-aws-lambda");

  return nextToLambda(page)(event, context);
};

// DOCKER/DEV/ANYTHING: Start the server directly.
if (require.main === module) {
  const server = app.listen({
    port: PORT,
    host: HOST
  }, () => {
    const { address, port } = server.address();

    // eslint-disable-next-line no-console
    console.log(`Server started at http://${address}:${port}`);
  });
}
