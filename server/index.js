"use strict";

const { parse } = require("url");
const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const next = require("next");

const manifests = {
  routes: require("../.next/routes-manifest.json"),
  pages: require("../.next/server/pages-manifest.json")
};

const DEFAULT_PORT = 4000;
const PORT = parseInt(process.env.SERVER_PORT || DEFAULT_PORT, 10);
const HOST = process.env.SERVER_HOST || "0.0.0.0";

// TODO(SERVER): Remove BASE_PATH altogether?
// Set up base path for both Node.js and Lambda.
let { BASE_PATH } = process.env;
if (typeof BASE_PATH === "undefined") {
  throw new Error("BASE_PATH is required");
}

// Normalize base path.
BASE_PATH = BASE_PATH.replace(/\/*$/, "");

// TODO(SERVER): REMOVE?
// // Next locations.
// const NEXT_DIR = path.resolve(__dirname, "../.next");
// const NEXT_SERVER_DIR = path.join(NEXT_DIR, "server");
// const NEXT_PAGES_DIR = path.join(NEXT_SERVER_DIR, "pages");
// const NEXT_PUBLIC_DIR = path.resolve(__dirname, "../public");

// // Send response.
// const sendPage = ({ pagePath, req, res }) => {
//   const fullPath = path.join(NEXT_SERVER_DIR, pagePath);
//   if (fullPath.endsWith(".html")) {
//     return res.sendFile(fullPath);
//   }

//   if (fullPath.endsWith(".js")) {
//     const page = require(fullPath);
//     return page.render(req, res);
//   }

//   throw new Error(`Unknown page format: ${pagePath}`);
// };

// Create the server app.
const getApp = async () => {
  const nextApp = next({ dev: false });
  await nextApp.prepare();
  const nextHandler = nextApp.getRequestHandler();

  // TODO(SERVER): REMOVE?
  // // Normalize appRoot.
  // // const appRoot = BASE_PATH.replace(/\/*$/, "");
  // const appRoot = "";
  //
  // Build stuff.
  // const NEXT_APP_ROOT = `${appRoot}/_next`;
  // const BUILD_ID = (await fs.readFile(path.join(NEXT_DIR, "BUILD_ID"))).toString().trim();
  // const NEXT_DATA_ROOT = `${NEXT_APP_ROOT}/data/${BUILD_ID}`;

  // Stage, base path stuff.
  const app = express();

  // Development tweaks.
  app.set("json spaces", 2);

  // TODO(SERVER): REMOVE?
  // // TODO(STATIC): For this demo only, we just handle serve static content
  // // directly through the express app. For a real app, you'll want to deploy
  // // static contents to somewhere to be directly served by the CDN.
  // app.use(`${NEXT_APP_ROOT}/static`, express.static(path.join(NEXT_DIR, "static")));

  // // TODO(SERVER): NEED THIS?
  // //
  // // Manually proxy JSON data requests to file system.
  // // _next/data/y-BRZHyY6b_T25zMSRPY0/posts/ssg-ssr.json ->
  // // _next/server/posts/ssg-ssr.json
  // //
  // // TODO(STATIC): This _also_ could be uploaded to a real static serve.
  // // It technically _could_ change from data, so possibly disable SSG and
  // // make this always dynamically generated.
  // app.get(`${NEXT_DATA_ROOT}/*`, (req, res, next) => {
  //   // Only handle JSON.
  //   if (req.url.endsWith(".json")) {
  //     const filePath = req.url.replace(NEXT_DATA_ROOT, NEXT_PAGES_DIR);
  //     return res.sendFile(filePath);
  //   }

  //   return next();
  // });

  // Page handlers,
  app.use((req, res) => {
    // Patch req.
    const parsedUrl = parse(req.url, true);

    console.log(JSON.stringify({
      msg: "TODO REMOVE SERVER ROUTES",
      url: req.url,
      _nextHadBasePath: req._nextHadBasePath
    }, null, 2))

    return nextHandler(req, res, parsedUrl);
  });

  // // TODO(STATIC): User-added static assets. Should not be in Lambda.
  // app.use(`${APP_ROOT}/`, express.static(NEXT_PUBLIC_DIR));

  // // Not found handling.
  // app.use((req, res) => sendPage({
  //   pagePath: manifests.pages["/404"],
  //   req,
  //   res: res.status(404)
  // }));

  // // Error handler.
  // app.use((err, req, res, next) => {
  //   console.error(err.stack);
  //   return sendPage({
  //     pagePath: manifests.pages["/_error"],
  //     req,
  //     res: res.status(500)
  //   });
  // });

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
