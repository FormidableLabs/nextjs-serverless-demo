"use strict";

/**
 * Compare our tracing outputs vs. Vercel's nft tracing outputs.
 *
 * Usage:
 *
 * ```sh
 * # Build / package everything.
 * $ yarn clean && yarn build
 * $ yarn lambda:sls package
 *
 * # Run comparison.
 * $ node ./scripts/compare-nft.js
 * ```
 *
 * Note: We don't actually have real deps, we're just brittly using what's already found in
 * `node_modules` :)
 */
const fs = require("fs").promises;
const path = require("path");
const globby = require("globby");
const AdmZip = require("adm-zip");
const chalk = require("chalk");

const cwd = path.resolve(__dirname, "..");

// ============================================================================
// Helpers
// ============================================================================
const { log, error } = console;
const difference = (s1, s2) => new Set([...s1].filter((x) => !s2.has(x)));

const zipContents = (zipPath) => {
  const zip = new AdmZip(zipPath);
  return zip.getEntries().map(({ entryName }) => entryName);
};


// Needs `yarn build`
const getNftFiles = async () => {
  const nfts = await globby([".next/**/*.nft.json"], { cwd });
  const allFiles = new Set();

  for (const nft of nfts) {
    const dir = path.resolve(cwd, path.dirname(nft));
    const { files } = JSON.parse((await fs.readFile(path.resolve(cwd, nft))).toString());
    for (const file of files) {
      allFiles.add(path.relative(cwd, path.resolve(dir, file)));
    }
  }

  return allFiles;
};

// Needs `yarn lambda:sls package` after `yarn build`
const getTraceFiles = async () => {
  const files = zipContents(path.resolve(cwd, ".serverless/blog.zip"));
  return new Set(files);
};

// ============================================================================
// Script
// ============================================================================
const cli = async () => {
  const nftFiles = await getNftFiles();
  const traceFiles = await getTraceFiles();

  const missingInNft = Array.from(difference(traceFiles, nftFiles)).sort();
  const missingInTrace = Array.from(difference(nftFiles, traceFiles)).sort();

  log(chalk `
{cyan ## Stats}

* Entries:
    * NFT:   {gray ${nftFiles.size}}
    * Trace: {gray ${traceFiles.size}}

{cyan ## Differences}
{green ## Missing in NFT} ({gray ${missingInNft.length}})
${missingInNft.map((m) => `- ${m}`).join("\n")}

{green ## Missing in Trace} ({gray ${missingInTrace.length}})
${missingInTrace.map((m) => `- ${m}`).join("\n")}
`);
};

if (require.main === module) {
  cli().catch((err) => {
    error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  });
}

module.exports = {
  cli
};
