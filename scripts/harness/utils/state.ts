import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./paths.ts";
import { resolveWorkspace, type Workspace } from "./workspaces.ts";

/**
 * The harness keeps its state in `.harness/` at the repository root
 * (gitignored). There is only ever one daemon, so there is one of each file:
 *
 *   workspace    the current workspace; written by start, kept after stop
 *   daemon.pid   the running daemon's PID; removed on stop
 */
export const HARNESS_DIR = path.join(ROOT_DIR, ".harness");

const WORKSPACE_FILE = "workspace";

const PID_FILE = "daemon.pid";

export function recordWorkspace(
  workspace: Workspace,
  harnessDir: string = HARNESS_DIR
): void {
  fs.mkdirSync(harnessDir, { recursive: true });
  fs.writeFileSync(
    path.join(harnessDir, WORKSPACE_FILE),
    `${workspace.name}\n`
  );
}

export function recordedWorkspace(
  harnessDir: string = HARNESS_DIR
): Workspace | undefined {
  let name: string;

  try {
    name = fs.readFileSync(path.join(harnessDir, WORKSPACE_FILE), "utf8");
  } catch {
    return undefined;
  }

  return resolveWorkspace(name.trim());
}

/** The recorded workspace, or an error saying how to record one. */
export function requireRecordedWorkspace(
  harnessDir: string = HARNESS_DIR
): Workspace {
  const workspace = recordedWorkspace(harnessDir);

  if (workspace === undefined) {
    throw new Error(
      "No workspace recorded. Run `start --workspace <name>` first."
    );
  }

  return workspace;
}

/**
 * The PID of the running daemon, or undefined if there is none. A PID file
 * whose process has gone is stale, and counts as no daemon.
 */
export function runningDaemonPid(
  harnessDir: string = HARNESS_DIR
): number | undefined {
  let pid: number;

  try {
    pid = Number.parseInt(
      fs.readFileSync(path.join(harnessDir, PID_FILE), "utf8").trim(),
      10
    );
  } catch {
    return undefined;
  }

  if (Number.isNaN(pid)) {
    return undefined;
  }

  try {
    // Signal 0 checks that the process exists without touching it.
    process.kill(pid, 0);

    return pid;
  } catch {
    return undefined;
  }
}
