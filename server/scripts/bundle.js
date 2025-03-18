#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ANTLR_MODULE_PATH = "../node_modules/@solidity-parser/parser/dist/antlr";

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
  const definedConstants = {};

  for (const key of [
    "SOLIDITY_GA_SECRET",
    "SOLIDITY_GOOGLE_TRACKING_ID",
    "SOLIDITY_SENTRY_DSN",
  ]) {
    const value = process.env[key];
    if (!value || value === "") {
      throw new Error(
        `\n\n'${key}' not set, have you added an '.env' file based on 'env.example'?\n\n`
      );
    }

    definedConstants[`process.env.${key}`] = `"${value}"`;
    console.log(`Read 'process.env.${key}' from '.env' file.`);
  }

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
    external: [
      "@nomicfoundation/solidity-analyzer",
      "@nomicfoundation/slang",
      "fsevents",
      "mocha",
    ],
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
