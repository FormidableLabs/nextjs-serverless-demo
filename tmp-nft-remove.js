"use strict";

// TODO(NEXT13): REMOVE

const globby = require("globby");

// ============================================================================
// Script
// ============================================================================
const cli = async ({ args = [] } = {}) => {
  const nfts = await globby([".next/**/*.nft.json"], { cwd: __dirname })

  console.log("TODO HERE", { nfts })
};

if (require.main === module) {
  cli({
    args: process.argv.slice(2) // eslint-disable-line no-magic-numbers
  }).catch((err) => {
    error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  });
}

module.exports = {
  cli
};
