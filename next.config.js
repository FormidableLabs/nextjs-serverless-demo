"use strict";

const { nextExternals } = require("./server/util");

module.exports = {
  target: "serverless",
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add more information in the bundle.
      config.output.pathinfo = true;

      // Keep `node_modules` as runtime requires to help slim down page bundles.
      config.externals = (config.externals || []).concat(
        nextExternals()
      )
    }


    return config;
  },
};
