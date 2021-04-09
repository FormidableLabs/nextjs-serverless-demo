"use strict";

const { nextExternals } = require("./server/util");

// **NOTE**: We set a base path that assumes Lambda staging _and_ our
// APIGW proxy base path (of `blog` by default). Many real world apps will
// just have a root base path and it's probably easier than this.
const { BASE_PATH, NEXT_SKIP_EXTERNALS = "false" } = process.env;
if (!BASE_PATH) {
  throw new Error("BASE_PATH is required");
}

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

      // TODO: Replace with `webpack-next-externals` when ready.
      // // Keep `node_modules` as runtime requires to help slim down page bundles.
      // config.externals = (config.externals || []).concat(
      //   NEXT_SKIP_EXTERNALS === "true" ? [] : nextExternals()
      // );
    }

    return config;
  }
};
