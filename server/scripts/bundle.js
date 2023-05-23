#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ANTLR_MODULE_PATH =
  "../server/node_modules/@solidity-parser/parser/dist/antlr";

const SOLIDITY_TOKENS = "Solidity.tokens";
const SOLIDITY_LEXER_TOKENS = "SolidityLexer.tokens";

const serverOutDir = "./out";
const serverAntlrDir = path.join(serverOutDir, "antlr");

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

async function main() {
  if (!process.env.SOLIDITY_GA_SECRET) {
    console.warn(
      "\n\n  SOLIDITY_GA_SECRET not set, have you added a .env file based on the example?\n\n"
    );
  } else {
    console.log(`Read SOLIDITY_GA_SECRET from .env file`);
  }

  if (!process.env.SOLIDITY_GOOGLE_TRACKING_ID) {
    console.warn(
      "\n\n  SOLIDITY_GOOGLE_TRACKING_ID not set, have you added a .env file based on the example?\n\n"
    );
  } else {
    console.log(`Read SOLIDITY_GOOGLE_TRACKING_ID from .env file`);
  }

  if (!process.env.SOLIDITY_SENTRY_DSN) {
    console.warn(
      "\n\n  SOLIDITY_SENTRY_DSN not set, have you added a .env file based on the example?\n\n"
    );
  } else {
    console.log(`Read SOLIDITY_SENTRY_DSN from .env file`);
  }

  const definedConstants =
    !process.env.SOLIDITY_GA_SECRET |
      !process.env.SOLIDITY_GOOGLE_TRACKING_ID ||
    !process.env.SOLIDITY_SENTRY_DSN
      ? {}
      : {
          "process.env.SOLIDITY_GA_SECRET": `"${process.env.SOLIDITY_GA_SECRET}"`,
          "process.env.SOLIDITY_GOOGLE_TRACKING_ID": `"${process.env.SOLIDITY_GOOGLE_TRACKING_ID}"`,
          "process.env.SOLIDITY_SENTRY_DSN": `"${process.env.SOLIDITY_SENTRY_DSN}"`,
        };

  // Ensure output directories exist
  ensureDirExists(serverOutDir);
  ensureDirExists(serverAntlrDir);

  // Copy across the two token files that
  // solidity-parser pulls via readFile (is there
  // a way of doing this with the bundler?)
  // We have to do this for both server and client
  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_TOKENS),
    path.join(serverAntlrDir, SOLIDITY_TOKENS)
  );
  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_LEXER_TOKENS),
    path.join(serverAntlrDir, SOLIDITY_LEXER_TOKENS)
  );

  const { warnings, errors } = await esbuild.build({
    entryPoints: {
      "./out/index": "./src/index.ts",
      "./out/hardhat.config": "./src/hardhat.config.ts",
      "./out/worker/WorkerProcess":
        "./src/frameworks/Hardhat/worker/WorkerProcess.ts",
      "./out/ConfigLoader": "./src/frameworks/Truffle/ConfigLoader.ts",
    },
    bundle: true,
    minifyWhitespace: true,
    minifyIdentifiers: false,
    minifySyntax: true,
    external: ["@nomicfoundation/solidity-analyzer", "fsevents", "mocha"],
    platform: "node",
    outdir: ".",
    logLevel: "info",
    target: "node14",
    define: definedConstants,
  });

  if (warnings.length > 1 || errors.length > 1) {
    console.error("Warning/Errors found");
    for (const message of warnings.concat(errors)) {
      console.error(message);
    }

    process.exit(1);
  }
}

void main();
