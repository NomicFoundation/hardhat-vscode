import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { copyAntlrTokens } from "../utils/antlr.ts";
import { definedConstants, loadEnvFile } from "../utils/env.ts";
import { build, commonOptions } from "../utils/esbuild.ts";
import { CLIENT_DIR, ROOT_DIR, SERVER_DIR } from "../utils/paths.ts";

const execAsync = promisify(exec);

/**
 * Assemble `client/tmp`, which is the directory `vsce package` is run from.
 * Everything the vsix ships is either bundled into it here or copied into it
 * here — no `.vscodeignore` is copied across, so whatever is left in `tmp`
 * afterwards is what ends up in the extension.
 */
export async function bundleClient(): Promise<void> {
  loadEnvFile();

  const buildTimeSecrets = definedConstants();

  const tmpDir = path.join(CLIENT_DIR, "tmp");

  const serverDir = path.join(tmpDir, "server");
  const serverAntlrDir = path.join(serverDir, "out", "antlr");
  const serverWorkerDir = path.join(serverDir, "out", "worker");

  const clientOutDir = path.join(tmpDir, "out");
  const imagesDir = path.join(tmpDir, "docs", "images");
  const snippetsDir = path.join(tmpDir, "snippets");
  const syntaxesDir = path.join(tmpDir, "syntaxes");

  for (const dir of [
    serverAntlrDir,
    serverWorkerDir,
    clientOutDir,
    imagesDir,
    snippetsDir,
    syntaxesDir,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (const file of [
    "README.md",
    "package.json",
    "language-configuration.json",
    "CHANGELOG.md",
    "LICENSE",
  ]) {
    fs.copyFileSync(path.join(CLIENT_DIR, file), path.join(tmpDir, file));
  }

  fs.copyFileSync(
    path.join(ROOT_DIR, "docs", "images", "vscode-logo.png"),
    path.join(imagesDir, "vscode-logo.png")
  );

  copyAntlrTokens(serverAntlrDir);

  fs.copyFileSync(
    path.join(CLIENT_DIR, "snippets", "solidity.json"),
    path.join(snippetsDir, "solidity.json")
  );

  for (const file of ["solidity.json", "solidity-markdown-injection.json"]) {
    fs.copyFileSync(
      path.join(CLIENT_DIR, "syntaxes", file),
      path.join(syntaxesDir, file)
    );
  }

  await build({
    ...commonOptions({ absWorkingDir: CLIENT_DIR, buildTimeSecrets }),
    entryPoints: {
      "./tmp/out/extension": "./src/extension.ts",
      "./tmp/server/out/index": "../server/src/index.ts",
      "./tmp/server/out/hardhat.config": "../server/src/hardhat.config.ts",
      "./tmp/server/out/worker/WorkerProcess":
        "../server/src/frameworks/Hardhat/Hardhat2/worker/WorkerProcess.ts",
      "./tmp/server/out/ConfigLoader":
        "../server/src/frameworks/Truffle/ConfigLoader.ts",
    },
    loader: {
      ".md": "text",
    },
  });

  await fetchExternalServerDependencies(serverDir);
}

/**
 * The two server dependencies that cannot be bundled — both are native — are
 * installed into `tmp/server` instead, and `.vscodeignore` allow-lists them
 * into the vsix.
 */
async function fetchExternalServerDependencies(
  serverDir: string
): Promise<void> {
  console.log("> Fetching external server dependencies...");

  const serverPackageJson: { dependencies?: Record<string, string> } =
    JSON.parse(fs.readFileSync(path.join(SERVER_DIR, "package.json"), "utf8"));

  const serverDeps = serverPackageJson.dependencies;

  if (serverDeps === undefined) {
    console.error("Error: Could not find server dependencies");

    process.exit(1);
  }

  const solidityAnalyzerVersion =
    serverDeps["@nomicfoundation/solidity-analyzer"];
  const slangVersion = serverDeps["@nomicfoundation/slang"];

  const packageJsonPath = path.join(serverDir, "package.json");

  fs.writeFileSync(
    packageJsonPath,
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
      },
    })
  );

  // Deliberately npm, not pnpm: this throwaway package outside the workspace
  // exists to produce a flat `node_modules` holding every platform build of
  // solidity-analyzer, which `.vscodeignore` then allow-lists into the vsix.
  // `--force` is what makes npm install optional dependencies for platforms
  // other than this one, and vsce packages real files, not symlinks.
  const { stdout } = await execAsync("npm install --force", {
    cwd: serverDir,
    env: { ...process.env, loglevel: "silent" },
  });

  console.log(stdout);

  fs.unlinkSync(packageJsonPath);
}
