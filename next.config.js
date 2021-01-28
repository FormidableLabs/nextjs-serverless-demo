"use strict";

module.exports = {
  target: "serverless",
  webpack: (config) => {
    // Add more information in the bundle.
    config.output.pathinfo = true;

    return config;
  },
};
