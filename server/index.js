"use strict";

const fs = require("fs").promises;
const path = require("path");
const express = require("express");

const page = require("../.next/serverless/pages/index.js");

const DEFAULT_PORT = 3000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";
const BASE_PATH = process.env.BASE_PATH || "/blog";
const STAGE = process.env.STAGE || "localdev";

const NEXT_DIR = path.resolve(__dirname, "../.next");
const NEXT_APP_ROOT = "/_next";

// Create the server app.
const getApp = async ({ basePath = "" } = {}) => {
  const buildId = (await fs.readFile(path.join(NEXT_DIR, "BUILD_ID"))).toString().trim();
  const app = express();

  // NOTE(STATIC): For this demo only, we just handle serve static content
  // directly through the express app. For a real app, you'll want to deploy
  // static contents to somewhere to be directly served by the CDN.
  app.use(`${NEXT_APP_ROOT}/static`, express.static(path.join(NEXT_DIR, "static")));

  // Proxy data requests.
  // _next/data/y-BRZHyY6b_T25zMSRPY0/posts/ssg-ssr.json ->
  // _next/serverless/posts/ssg-ssr.json
  app.use(
    `${NEXT_APP_ROOT}/data/${buildId}`,
    express.static(path.join(NEXT_DIR, "serverless/pages"))
  );

  // Page handlers,
  app.all(`${basePath}`, (req, res) => {
    console.log("TODO HERE REQ", req.url);
    return page.render(req, res);
  });

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
    basePath: BASE_PATH
  }));

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
