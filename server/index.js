"use strict";

// TODO: HERE -- Refactor to express with static.
const express = require("express");

const page = require("../.next/serverless/pages/index.js");

const DEFAULT_PORT = 3000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";
const BASE_PATH = process.env.BASE_PATH || "/blog";
const STAGE = process.env.STAGE || "localdev";

// Create the server app.
const getApp = ({ basePath = "" } = {}) => {
  const app = express();
  app.all(`${basePath}`, (req, res) => {
    console.log("TODO HERE REQ", req.url)
    return page.render(req, res);
  });

  return app;
};

// LAMBDA: Export handler for lambda use.
let handler;
module.exports.handler = async (event, context) => {
  // Lazy require `serverless-http` to allow non-Lambda targets to omit.
  // eslint-disable-next-line global-require
  handler = handler || require("serverless-http")(getApp({
    basePath: BASE_PATH
  }));

  return handler(event, context);
};

// DOCKER/DEV/ANYTHING: Start the server directly.
if (require.main === module) {
  const server = getApp().listen({
    port: PORT,
    host: HOST
  }, () => {
    const { address, port } = server.address();

    // eslint-disable-next-line no-console
    console.log(`Server started at http://${address}:${port}`);
  });
}
