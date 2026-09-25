import fs from "node:fs";
import path from "node:path";
import { run } from "../utils/process.ts";
import {
  FORGE_STD_VERSION,
  resolveWorkspace,
  type Workspace,
  workspaceNames,
} from "../utils/workspaces.ts";

/**
 * Install each workspace's dependencies, then build it once so the compilers
 * it needs are downloaded before a language server is pointed at it. Safe to
 * run again: installs are frozen to the committed lockfiles, and forge-std is
 * only fetched when the installed version is not the pinned one.
 */
export function init(workspaceName: string | undefined): void {
  const workspaces =
    workspaceName === undefined
      ? workspaceNames().map(resolveWorkspace)
      : [resolveWorkspace(workspaceName)];

  for (const workspace of workspaces) {
    console.log(`\n== ${workspace.name} ==`);

    switch (workspace.framework) {
      case "hardhat":
        initHardhat(workspace);
        break;
      case "foundry":
        initFoundry(workspace);
        break;
    }
  }
}

function initHardhat({ dir }: Workspace): void {
  // Each Hardhat workspace has its own pnpm-workspace.yaml, which makes it a
  // workspace root rather than a member of the repository's workspace.
  run("pnpm", ["install", "--frozen-lockfile"], dir);
  run("pnpm", ["exec", "hardhat", "compile"], dir);
}

function initFoundry({ dir }: Workspace): void {
  const forgeStdDir = path.join(dir, "lib", "forge-std");

  if (installedForgeStdVersion(forgeStdDir) === FORGE_STD_VERSION) {
    console.log(`forge-std ${FORGE_STD_VERSION} already installed`);
  } else {
    fs.rmSync(forgeStdDir, { recursive: true, force: true });

    // --no-git copies the library in rather than adding a submodule, which
    // would land in the hardhat-vscode repository itself.
    run(
      "forge",
      ["install", "--no-git", `foundry-rs/forge-std@${FORGE_STD_VERSION}`],
      dir
    );
  }

  run("forge", ["build"], dir);
}

function installedForgeStdVersion(forgeStdDir: string): string | undefined {
  try {
    const { version } = JSON.parse(
      fs.readFileSync(path.join(forgeStdDir, "package.json"), "utf8")
    );

    return `v${version}`;
  } catch {
    return undefined;
  }
}
