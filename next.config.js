"use strict";

const { nextExternals } = require("./server/util");

// **NOTE**: We set a base path that assumes Lambda staging _and_ our
// APIGW proxy base path (of `blog` by default). Many real world apps will
// just have a root base path and it's probably easier than this.
//
// - For build and local node servers, it's typically `/blog`.
// - For Lambda (localdev or cloud), it's typically `/${STAGE}/blog`.
const { STAGE, APP_PATH } = process.env;
const BASE_PATH = `/${STAGE}${APP_PATH}`;


module.exports = {
  target: "serverless",
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  env: {
    BASE_PATH
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add more information in the bundle.
      config.output.pathinfo = true;

      // Keep `node_modules` as runtime requires to help slim down page bundles.
      config.externals = (config.externals || []).concat(
        nextExternals()
      );
    }

    return config;
  }
};
