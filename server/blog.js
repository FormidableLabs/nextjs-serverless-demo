"use strict";

const { parse } = require("url");
const path = require("path");
const express = require("express");
const NextNodeServer = require("next/dist/server/next-server").default;
const { defaultConfig } = require("next/dist/server/config-shared");
const { addRootHandlers } = require("./root");
const nextConfig = require("../next.config");

const DEFAULT_PORT = 4000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";
const JSON_INDENT = 2;

// Create the server app.
const getApp = async ({ extraHandlers } = {}) => {
  // Get server config.
  // TODO: Deep merge / whatever next does.
  const serverConfig = Object.assign({}, defaultConfig, nextConfig);

  // Set up Next.js server.
  // We use the trace output generated Server file as our model from Next.js:
  // https://unpkg.com/browse/next@12.1.0/dist/build/utils.js
  // See `copyTracedFiles()` and outputted server.
  const nextApp = new NextNodeServer({
    dev: false,
    dir: path.resolve(__dirname, ".."),
    conf: {
      ...serverConfig,
      distDir: "./.next" // relative to `dir`
    }
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
