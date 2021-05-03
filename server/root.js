"use strict";

const express = require("express");

const DEFAULT_PORT = 4000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";
const JSON_INDENT = 2;

// Export root handlers so we can add those to Node.js localdev.
const addRootHandlers = module.exports.addRootHandlers = (app) => {
  // Page handlers,
  app.use(express.static("public"));
  app.get("/", (req, res) => res.json({
    msg: "Root handler. Check out /blog for more!"
  }));

  return app;
};

// Create the server app.
const getApp = async () => {
  // Stage, base path stuff.
  const app = express();

  // Development tweaks.
  app.set("json spaces", JSON_INDENT);

  addRootHandlers(app);

  return app;
};

// LAMBDA: Export handler for lambda use.
let handler;
module.exports.handler = async (event, context) => {
  // Lazy require `serverless-http` to allow non-Lambda targets to omit.
  // eslint-disable-next-line global-require
  handler = handler || require("serverless-http")(
    await getApp(),
    // TODO(STATIC): Again, shouldn't be serving images from the Lambda :)
    {
      binary: ["image/*"]
    }
  );

  return handler(event, context);
};

// DOCKER/DEV/ANYTHING: Start the server directly.
if (require.main === module) {
  (async () => {
    const server = (await getApp()).listen({
      port: PORT,
      host: HOST
    }, () => {
      const { address, port } = server.address();

      // eslint-disable-next-line no-console
      console.log(`Server started at http://${address}:${port}`);
    });
  })();
}
