"use strict";

const { parse } = require("url");
const path = require("path");
const express = require("express");
const NextNodeServer = require("next/dist/server/next-server").default;
const nextConstants = require("next/dist/shared/lib/constants");
const loadConfig = require("next/dist/server/config").default;
const { addRootHandlers } = require("./root");

const DEFAULT_PORT = 4000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";
const JSON_INDENT = 2;

// Create the server app.
const getApp = async ({ extraHandlers } = {}) => {
  // Set up Next.js server.
  const serverConfig = await loadConfig(nextConstants.PHASE_PRODUCTION_SERVER, process.cwd());
  const nextApp = new NextNodeServer({
    dev: false,
    dir: path.resolve(__dirname, ".."),
    conf: serverConfig
  });
  await nextApp.prepare();
  const nextHandler = nextApp.getRequestHandler();

  // Stage, base path stuff.
  const app = express();

  // Development tweaks.
  app.set("json spaces", JSON_INDENT);

  // Add in extra handlers
  if (extraHandlers) {
    extraHandlers(app);
  }

  // Page handlers,
  app.use((req, res) => {
    const parsedUrl = parse(req.url, true);
    return nextHandler(req, res, parsedUrl);
  });

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
    const server = (await getApp({
      extraHandlers: addRootHandlers
    })).listen({
      port: PORT,
      host: HOST
    }, () => {
      const { address, port } = server.address();

      // eslint-disable-next-line no-console
      console.log(`Server started at http://${address}:${port}`);
    });
  })();
}
