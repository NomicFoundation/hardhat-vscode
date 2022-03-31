#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ANTLR_MODULE_PATH =
  "server/node_modules/@solidity-parser/parser/dist/antlr";

const SOLIDITY_TOKENS = "Solidity.tokens";
const SOLIDITY_LEXER_TOKENS = "SolidityLexer.tokens";

const clientOutDir = "./client/out";
const serverOutDir = "./server/out";
const clientAntlrDir = path.join(clientOutDir, "antlr");
const serverAntlrDir = path.join(serverOutDir, "antlr");

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

async function main() {
  // Ensure output directories exist
  ensureDirExists(clientOutDir);
  ensureDirExists(serverOutDir);
  ensureDirExists(clientAntlrDir);
  ensureDirExists(serverAntlrDir);

  // Copy across the two token files that
  // solidity-parser pulls via readFile (is there
  // a way of doing this with the bundler?)
  // We have to do this for both server and client
  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_TOKENS),
    path.join(clientAntlrDir, SOLIDITY_TOKENS)
  );
  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_LEXER_TOKENS),
    path.join(clientAntlrDir, SOLIDITY_LEXER_TOKENS)
  );
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
      "./client/out/extension": "./client/src/extension.ts",
      "./server/out/index": "./server/src/index.ts",
      "./server/out/helper":
        "./server/src/parser/services/validation/helper.ts",
    },
    bundle: true,
    minifyWhitespace: true,
    minifyIdentifiers: false,
    minifySyntax: true,
    external: ["vscode"],
    platform: "node",
    outdir: ".",
    logLevel: "info",
  });

  if (warnings.length > 1 || errors.length > 1) {
    console.error("Warning/Errors found");
    for (const message of warnings.concat(errors)) {
      console.error(message);
    }

    process.exit(1);
  }
}

main();
