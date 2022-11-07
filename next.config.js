"use strict";

// **NOTE**: We set a base path that assumes Lambda staging _and_ our
// APIGW proxy base path (of `blog` by default). Many real world apps will
// just have a root base path and it's probably easier than this.
const { BASE_PATH } = process.env;
if (!BASE_PATH) {
  throw new Error("BASE_PATH is required");
}

module.exports = {
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  env: {
    BASE_PATH
  }
};
