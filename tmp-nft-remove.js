"use strict";

// TODO(NEXT13): REMOVE
const fs = require("fs").promises;
const path = require("path");
const globby = require("globby");

// ============================================================================
// Script
// ============================================================================
const cli = async ({ args = [] } = {}) => {
  const nfts = await globby([".next/**/*.nft.json"], { cwd: __dirname });
  let allFiles = new Set();

  for (let nft of nfts) {
    const dir = path.resolve(__dirname, path.dirname(nft));
    let { files } = JSON.parse((await fs.readFile(path.resolve(__dirname, nft))).toString());
    for (let file of files) {
      allFiles.add(path.relative(__dirname, path.resolve(dir, file)));
    }
  }

  const sortedFiles = Array.from(allFiles).sort();
  console.log("TODO HERE", sortedFiles)
};

if (require.main === module) {
  cli({
    args: process.argv.slice(2) // eslint-disable-line no-magic-numbers
  }).catch((err) => {
    console.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  });
}

module.exports = {
  cli
};
