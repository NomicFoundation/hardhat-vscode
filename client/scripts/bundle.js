#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const esbuild = require("esbuild");

const ANTLR_MODULE_PATH =
  "../server/node_modules/@solidity-parser/parser/dist/antlr";
const SERVER_MODULE_PATH =
  "../node_modules/@nomicfoundation/solidity-language-server";

const SOLIDITY_TOKENS = "Solidity.tokens";
const SOLIDITY_LEXER_TOKENS = "SolidityLexer.tokens";

const tmpDir = "./tmp";
const serverDir = path.join(tmpDir, "./server");
const serverOutDir = path.join(tmpDir, "./server/out");
const serverAntlrDir = path.join(serverOutDir, "antlr");
const serverWorkerDir = path.join(serverOutDir, "worker");

const clientDir = path.join(tmpDir);
const clientOutDir = path.join(clientDir, "./out");
const clientAntlrDir = path.join(clientOutDir, "antlr");

const docsDir = path.join(tmpDir, "./docs");
const imagesDir = path.join(docsDir, "./images");

const snippets = path.join(tmpDir, "./snippets");
const syntaxes = path.join(tmpDir, "./syntaxes");

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
  ensureDirExists(tmpDir);

  // Server
  ensureDirExists(serverDir);
  ensureDirExists(serverOutDir);
  ensureDirExists(serverAntlrDir);
  ensureDirExists(serverWorkerDir);
  // Client
  ensureDirExists(clientDir);
  ensureDirExists(clientOutDir);
  ensureDirExists(clientAntlrDir);
  // Docs
  ensureDirExists(docsDir);
  ensureDirExists(imagesDir);

  ensureDirExists(snippets);
  ensureDirExists(syntaxes);

  fs.copyFileSync(path.join(".", "README.md"), path.join(tmpDir, "README.md"));
  fs.copyFileSync(
    path.join(".", "package.json"),
    path.join(tmpDir, "package.json")
  );

  fs.copyFileSync(
    path.join(".", "language-configuration.json"),
    path.join(tmpDir, "language-configuration.json")
  );

  fs.copyFileSync(
    path.join(".", "CHANGELOG.md"),
    path.join(tmpDir, "CHANGELOG.md")
  );

  fs.copyFileSync(path.join(".", "LICENSE"), path.join(tmpDir, "LICENSE"));

  fs.copyFileSync(
    path.join(__dirname, "..", "..", "docs", "images", "vscode-logo.png"),
    path.join(imagesDir, "vscode-logo.png")
  );

  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_TOKENS),
    path.join(serverAntlrDir, SOLIDITY_TOKENS)
  );
  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_LEXER_TOKENS),
    path.join(serverAntlrDir, SOLIDITY_LEXER_TOKENS)
  );
  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_TOKENS),
    path.join(clientAntlrDir, SOLIDITY_TOKENS)
  );
  fs.copyFileSync(
    path.join(ANTLR_MODULE_PATH, SOLIDITY_LEXER_TOKENS),
    path.join(clientAntlrDir, SOLIDITY_LEXER_TOKENS)
  );

  fs.copyFileSync(
    path.join(".", "snippets", "solidity.json"),
    path.join(snippets, "solidity.json")
  );
  fs.copyFileSync(
    path.join(".", "syntaxes", "solidity.json"),
    path.join(syntaxes, "solidity.json")
  );
  fs.copyFileSync(
    path.join(".", "syntaxes", "solidity-markdown-injection.json"),
    path.join(syntaxes, "solidity-markdown-injection.json")
  );

  const { warnings, errors } = await esbuild.build({
    entryPoints: {
      "./tmp/out/extension": "./src/extension.ts",
      "./tmp/server/out/index":
        "../node_modules/@nomicfoundation/solidity-language-server/src/index.ts",
      "./tmp/server/out/hardhat.config":
        "../node_modules/@nomicfoundation/solidity-language-server/src/hardhat.config.ts",
      "./tmp/server/out/worker/WorkerProcess":
        "../node_modules/@nomicfoundation/solidity-language-server/src/frameworks/Hardhat/worker/WorkerProcess.ts",
      "./tmp/server/out/ConfigLoader":
        "../node_modules/@nomicfoundation/solidity-language-server/src/frameworks/Truffle/ConfigLoader.ts",
    },
    bundle: true,
    minifyWhitespace: true,
    minifyIdentifiers: false,
    minifySyntax: true,
    external: [
      "vscode",
      "@nomicfoundation/solidity-analyzer",
      "@nomicfoundation/slang",
      "fsevents",
      "mocha",
    ],
    platform: "node",
    outdir: ".",
    logLevel: "info",
    loader: {
      ".md": "text",
    },
    define: definedConstants,
  });

  if (warnings.length > 1 || errors.length > 1) {
    console.error("Warning/Errors found");
    for (const message of warnings.concat(errors)) {
      console.error(message);
    }

    process.exit(1);
  }

  console.log("> Fetching external server dependencies...");
  const serverPackageFile = path.join(
    __dirname,
    "..",
    "..",
    "server",
    "package.json"
  );
  const serverPackageJson = JSON.parse(
    fs.readFileSync(serverPackageFile, "utf8")
  );
  const serverDeps = serverPackageJson?.dependencies;
  if (!serverDeps) {
    console.error("Error: Could not find server dependencies");
    process.exit(1);
  }
  const solidityAnalyzerVersion =
    serverDeps["@nomicfoundation/solidity-analyzer"];
  const slangVersion = serverDeps["@nomicfoundation/slang"];

  fs.writeFileSync(
    path.join(serverDir, "package.json"),
    JSON.stringify({
      name: "tmp",
      version: "0.0.1",
      dependencies: {
        "@nomicfoundation/solidity-analyzer": solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-darwin-arm64":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-win32-arm64-msvc":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-linux-arm64-gnu":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-linux-arm64-musl":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-win32-ia32-msvc":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-darwin-x64":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-win32-x64-msvc":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-linux-x64-gnu":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-linux-x64-musl":
          solidityAnalyzerVersion,
        "@nomicfoundation/solidity-analyzer-freebsd-x64":
          solidityAnalyzerVersion,

        "@nomicfoundation/slang": slangVersion,
        "@nomicfoundation/slang-darwin-arm64": slangVersion,
        "@nomicfoundation/slang-win32-arm64-msvc": slangVersion,
        "@nomicfoundation/slang-linux-arm64-gnu": slangVersion,
        "@nomicfoundation/slang-linux-arm64-musl": slangVersion,
        "@nomicfoundation/slang-win32-ia32-msvc": slangVersion,
        "@nomicfoundation/slang-darwin-x64": slangVersion,
        "@nomicfoundation/slang-win32-x64-msvc": slangVersion,
        "@nomicfoundation/slang-linux-x64-gnu": slangVersion,
        "@nomicfoundation/slang-linux-x64-musl": slangVersion,
      },
    })
  );

  await new Promise((resolve) => {
    exec(
      "npm install --force",
      { cwd: serverDir, env: { ...process.env, loglevel: "silent" } },
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          process.exit(1);
        }

        // if (stderr) {
        //   console.log(`stderr: ${stderr}`);
        //   process.exit(1);
        // }

        console.log(stdout);
        resolve();
      }
    );
  });

  fs.unlinkSync(path.join(serverDir, "package.json"));
}

main();
