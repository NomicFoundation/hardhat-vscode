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
 *   state.json   the daemon's control port and readiness; removed on stop
 *   daemon.log   the daemon's output when started with --background
 */
export const HARNESS_DIR = path.join(ROOT_DIR, ".harness");

const WORKSPACE_FILE = "workspace";

const PID_FILE = "daemon.pid";

const STATE_FILE = "state.json";

export const LOG_FILE = "daemon.log";

/** What a running daemon publishes about itself in `state.json`. */
export interface DaemonState {
  pid: number;
  workspace: string;
  /** The port of the HTTP control endpoint on 127.0.0.1. */
  port: number;
  startedAt: string;
  ready: boolean;
}

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

export function writeDaemonPid(
  pid: number,
  harnessDir: string = HARNESS_DIR
): void {
  fs.mkdirSync(harnessDir, { recursive: true });
  fs.writeFileSync(path.join(harnessDir, PID_FILE), `${pid}\n`);
}

export function writeDaemonState(
  state: DaemonState,
  harnessDir: string = HARNESS_DIR
): void {
  fs.mkdirSync(harnessDir, { recursive: true });

  // Written whole and renamed into place, so a reader polling it never sees
  // half a file.
  const file = path.join(harnessDir, STATE_FILE);
  fs.writeFileSync(`${file}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(`${file}.tmp`, file);
}

export function readDaemonState(
  harnessDir: string = HARNESS_DIR
): DaemonState | undefined {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(harnessDir, STATE_FILE), "utf8")
    ) as DaemonState;
  } catch {
    return undefined;
  }
}

/**
 * Remove what only lives as long as a daemon. The workspace file and the log
 * are kept: the first is the current workspace, the second is how to find out
 * why a daemon died.
 */
export function removeDaemonFiles(harnessDir: string = HARNESS_DIR): void {
  fs.rmSync(path.join(harnessDir, PID_FILE), { force: true });
  fs.rmSync(path.join(harnessDir, STATE_FILE), { force: true });
}

/** True when a PID file is left behind with no process behind it. */
export function hasStaleDaemonFiles(harnessDir: string = HARNESS_DIR): boolean {
  return (
    fs.existsSync(path.join(harnessDir, PID_FILE)) &&
    runningDaemonPid(harnessDir) === undefined
  );
}
