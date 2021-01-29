"use strict";

const fs = require("fs").promises;
const path = require("path");
const express = require("express");

const page = require("../.next/serverless/pages/index.js");

const DEFAULT_PORT = 3000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";

// Set up base path for both Node.js and Lambda.
const { STAGE, APP_PATH } = process.env;
if (typeof STAGE === "undefined") {
  throw new Error("STAGE is required");
}
if (typeof APP_PATH === "undefined") {
  throw new Error("APP_PATH is required");
}
const BASE_PATH = `/${STAGE}${APP_PATH}`;
process.env.BASE_PATH = BASE_PATH;

// Create the server app.
const getApp = async ({ appRoot = "" } = {}) => {
  // Normalize appRoot.
  appRoot = appRoot.replace(/\/*$/, "");

  // Build stuff.
  const NEXT_DIR = path.resolve(__dirname, "../.next");
  const NEXT_DATA_DIR = path.resolve(NEXT_DIR, "serverless/pages");
  const NEXT_PUBLIC_DIR = path.resolve(__dirname, "../public");
  const NEXT_APP_ROOT = `${appRoot}/_next`;

  const BUILD_ID = (await fs.readFile(path.join(NEXT_DIR, "BUILD_ID"))).toString().trim();
  const NEXT_DATA_ROOT = `${NEXT_APP_ROOT}/data/${BUILD_ID}`;

  // Stage, base path stuff.
  const app = express();

  // NOTE(STATIC): For this demo only, we just handle serve static content
  // directly through the express app. For a real app, you'll want to deploy
  // static contents to somewhere to be directly served by the CDN.
  app.use(`${NEXT_APP_ROOT}/static`, express.static(path.join(NEXT_DIR, "static")));

  // Manually proxy JSON data requests to file system.
  // _next/data/y-BRZHyY6b_T25zMSRPY0/posts/ssg-ssr.json ->
  // _next/serverless/posts/ssg-ssr.json
  //
  // NOTE(STATIC): This _also_ could be uploaded to a real static serve.
  // It technically _could_ change from data, so possibly disable SSG and
  // make this always dynamically generated.
  app.get(`${NEXT_DATA_ROOT}/*`, (req, res, next) => {
    // Only handle JSON.
    if (req.url.endsWith(".json")) {
      const filePath = req.url.replace(NEXT_DATA_ROOT, NEXT_DATA_DIR);
      return res.sendFile(filePath);
    }

    return next();
  });

  // Page handlers,
  // TODO(ROUTING): Need all the pages and routing.
  app.all(`${appRoot}/`, (req, res) => page.render(req, res));

  // NOTE(STATIC): User-added static assets. Should not be in Lambda.
  app.use(`${appRoot}/`, express.static(NEXT_PUBLIC_DIR));

  // TODO: 404.
  // TODO: Hook up error (?)

  return app;
};

// LAMBDA: Export handler for lambda use.
let handler;
module.exports.handler = async (event, context) => {
  // Lazy require `serverless-http` to allow non-Lambda targets to omit.
  // eslint-disable-next-line global-require
  handler = handler || require("serverless-http")(await getApp({
    appRoot: APP_PATH
  }));

  return handler(event, context);
};

// DOCKER/DEV/ANYTHING: Start the server directly.
if (require.main === module) {
  (async () => {
    const server = (await getApp({
      appRoot: BASE_PATH
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
