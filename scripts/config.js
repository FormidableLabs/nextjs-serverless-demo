#!/usr/bin/env node

"use strict";

const path = require("path");

const { PHASE_PRODUCTION_SERVER } = require("next/dist/shared/lib/constants");
const { "default": loadConfig } = require("next/dist/server/config");

const nextConf = require("../next.config");
const { error } = console;

// ============================================================================
// Script
// ============================================================================
const getConfig = async () => {
  const dir = path.resolve("..");
  const config = await loadConfig(PHASE_PRODUCTION_SERVER, dir, nextConf);
  console.log("TODO CONFIG", { config });
};

if (require.main === module) {
  getConfig().catch((err) => {
    error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  });
}
