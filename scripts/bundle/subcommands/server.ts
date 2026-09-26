import fs from "node:fs";
import path from "node:path";
import { copyAntlrTokens } from "../utils/antlr.ts";
import { definedConstants, loadEnvFile } from "../utils/env.ts";
import { build, commonOptions } from "../utils/esbuild.ts";
import { SERVER_DIR } from "../utils/paths.ts";

/**
 * Bundle the language server into `server/out`, which is what the
 * `@nomicfoundation/solidity-language-server` package publishes and what coc
 * consumes. The client bundle builds its own copy; the two do not share output.
 */
export async function bundleServer(): Promise<void> {
  loadEnvFile();

  const buildTimeSecrets = definedConstants();

  const outDir = path.join(SERVER_DIR, "out");
  const antlrDir = path.join(outDir, "antlr");

  fs.mkdirSync(antlrDir, { recursive: true });

  copyAntlrTokens(antlrDir);

  await build({
    ...commonOptions({ absWorkingDir: SERVER_DIR, buildTimeSecrets }),
    entryPoints: {
      "./out/index": "./src/index.ts",
      "./out/hardhat.config": "./src/hardhat.config.ts",
      "./out/worker/WorkerProcess":
        "./src/frameworks/Hardhat/Hardhat2/worker/WorkerProcess.ts",
      "./out/ConfigLoader": "./src/frameworks/Truffle/ConfigLoader.ts",
    },
  });
}
