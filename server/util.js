"use strict";

const path = require("path");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
//
// TODO: These are cribbed/tweaked from `trace-deps`. Should abstract / test / something.
// Simple conversion to produce Linux/Mac style forward slash-based paths.
const toPosix = (file) => !file ? file : file.replace(/\\/g, "/");

// Extract top-level package name + relative file path from full path.
//
// E.g., `["pkg2", "index.js"]` =>
// {
//   name: "pkg2",
//   file: pkg2/index.js
// }
const getPackageFromParts = (parts = []) => {
  // Get first part of package.
  const firstPart = parts[0];
  if (!firstPart) { return null; }

  // Default to unscoped.
  let name = firstPart;
  if (firstPart[0] === "@") {
    // Detect if scoped and adjust / short-circuit if no match.
    const secondPart = parts[1]; // eslint-disable-line no-magic-numbers
    if (!secondPart) { return null; }

    // Use posix path.
    name = [firstPart, secondPart].join("/");
  }

  return {
    name,
    file: parts.join(path.sep)
  };
};

const getPackageFromContext = (context = "") => {
  const parts = toPosix(path.normalize(context)).split("/");
  const nodeModulesIdx = parts.lastIndexOf("node_modules");
  if (nodeModulesIdx === -1) { return null; }

  return getPackageFromParts(parts.slice(nodeModulesIdx + 1));
};

const REQUEST_SKIP_LIST = [
  // Loaders and synthetic files.
  /^next-serverless-loader(\?|\/|$)/,
  /^next-plugin-loader(\?|\/|$)/,
  /^private-dot-next(\?|\/|$)/,
  /^private-next-pages(\?|\/|$)/,

  // This doesn't have an export and just patches Node.js `global`.
  "next/dist/next-server/server/node-polyfill-fetch"
  // "next/dist/build/webpack/loaders/next-serverless-loader/page-handler"
];
const getPackageFromRequest = (request = "") => {
  // Must start with a valid package prefix. Notably, not:
  // - Relative: `./foo.js`
  // - Absolute: `/PATH/TO/foo.js`
  if (!(/^[\@a-zA-Z]+/).test(request)) {
    return null;
  }

  // Skip Next.js loaders and things that need to be built in.
  if (REQUEST_SKIP_LIST.some(
    (strOrRe) => typeof strOrRe === "string" ? request.startsWith(strOrRe) : strOrRe.test(request)
  )) {
    return null;
  }

  const parts = toPosix(path.normalize(request)).split("/");
  return getPackageFromParts(parts);
};

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------

// Exclude all of node_modules with certain exceptions for Next.js
// common usage.
//
// Modeled after: https://github.com/liady/webpack-node-externals
// See: https://webpack.js.org/configuration/externals/#function
const nextExternals = () => (...args) => {
  // Handle all versions of webpack externals function signature.
  const isWebpack5 = !!(args[0] && args[0].context && args[0].request);
  const context = isWebpack5 ? args[0].context : args[0];
  const request = isWebpack5 ? args[0].request : args[1];
  const callback = args[isWebpack5 ? 3 : 2];

  // Somewhat different from `webpack-node-externals` we use `context` to
  // find things in `node_modules` that we should exclude in addition to
  // the module name itself. And we don't actually scan `node_modules`.
  const requestPkg = getPackageFromRequest(request);
  const contextPkg = getPackageFromContext(context);
  const externalName = requestPkg ? requestPkg.file : null;
  console.log("TODO HERE EXTERNAL", {
    request,
    requestPkg,
    // TODO: IGNORE CONTEXT?
    context,
    contextPkg,
    externalName
  });
  if (externalName !== null) {
    return void callback(null, `commonjs ${externalName}`);
  }

  // if (pkgName && !["next", "@next/env"].includes(pkgName)) {
  //   console.log("TODO HERE EXTERNAL", { pkgName })
  //   return void callback(null, `commonjs ${pkgName}`);
  // }

  callback();
};


module.exports = {
  nextExternals
};