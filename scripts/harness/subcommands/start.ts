import { spawn } from "node:child_process";
import fs from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import {
  CONTROL_HOST,
  createControlServer,
  isAlive,
  ping,
  sleep,
  stopDaemon,
} from "../utils/daemon.ts";
import { LanguageServerSession } from "../utils/lsp.ts";
import { ROOT_DIR } from "../utils/paths.ts";
import {
  type DaemonState,
  HARNESS_DIR,
  LOG_FILE,
  recordWorkspace,
  removeDaemonFiles,
  writeDaemonPid,
  writeDaemonState,
} from "../utils/state.ts";
import { resolveWorkspace, type Workspace } from "../utils/workspaces.ts";

const MAIN = path.join(import.meta.dirname, "..", "main.ts");

/** How long --background waits for the daemon to be ready. */
const READY_TIMEOUT_MS = 300_000;

/**
 * Start a daemon holding a language server against one workspace, replacing
 * any daemon already running. In the foreground this process is the daemon;
 * --background runs this same command detached and returns once it is ready.
 */
export async function start(
  workspaceName: string | undefined,
  background: boolean
): Promise<void> {
  if (workspaceName === undefined) {
    throw new Error("start needs --workspace <name>");
  }

  const workspace = resolveWorkspace(workspaceName);

  const stopped = await stopDaemon();

  if (stopped !== undefined) {
    log(`stopped the running daemon (PID ${stopped})`);
  }

  if (background) {
    return startInBackground(workspace);
  }

  return runDaemon(workspace);
}

async function runDaemon(workspace: Workspace): Promise<void> {
  recordWorkspace(workspace);
  writeDaemonPid(process.pid);

  const state: DaemonState = {
    pid: process.pid,
    workspace: workspace.name,
    port: 0,
    startedAt: new Date().toISOString(),
    ready: false,
  };

  const control = createControlServer(() => state);

  await new Promise<void>((resolve) =>
    control.listen(0, CONTROL_HOST, resolve)
  );

  state.port = (control.address() as AddressInfo).port;
  writeDaemonState(state);

  log(
    `daemon ${process.pid}: ${workspace.name}, control on port ${state.port}`
  );

  const session = new LanguageServerSession(workspace, log);
  let shuttingDown = false;

  const shutdown = async (exitCode: number) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    log("shutting down");

    await session.shutdown();
    control.close();

    // A replacing `start` waits for this process to exit before it writes
    // its own files, so these are still ours.
    removeDaemonFiles();

    process.exit(exitCode);
  };

  process.on("SIGINT", () => void shutdown(0));
  process.on("SIGTERM", () => void shutdown(0));

  void session.exited.then((code) => {
    if (!shuttingDown) {
      log(`the language server exited unexpectedly (code ${code})`);
      void shutdown(1);
    }
  });

  try {
    await session.initialize();
  } catch (error) {
    log(
      `failed to initialize: ${error instanceof Error ? error.message : error}`
    );

    return shutdown(1);
  }

  state.ready = true;
  writeDaemonState(state);

  log(`ready: http://${CONTROL_HOST}:${state.port}`);
}

async function startInBackground(workspace: Workspace): Promise<void> {
  fs.mkdirSync(HARNESS_DIR, { recursive: true });

  const logFile = path.join(HARNESS_DIR, LOG_FILE);
  const logFd = fs.openSync(logFile, "w");

  const child = spawn(
    process.execPath,
    [MAIN, "start", "--workspace", workspace.name],
    { cwd: ROOT_DIR, detached: true, stdio: ["ignore", logFd, logFd] }
  );

  child.unref();
  fs.closeSync(logFd);

  const pid = child.pid;

  if (pid === undefined) {
    throw new Error("Failed to start the daemon (no PID returned)");
  }

  log(`started daemon ${pid} for ${workspace.name}, waiting until it is ready`);

  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (!isAlive(pid)) {
      throw new Error(
        `The daemon exited before it was ready. The end of ${path.relative(ROOT_DIR, logFile)}:\n\n${tail(logFile)}`
      );
    }

    const state = await ping();

    if (state?.pid === pid && state.ready) {
      log(`ready: http://${CONTROL_HOST}:${state.port}`);

      return;
    }

    await sleep(250);
  }

  await stopDaemon();

  throw new Error(
    `The daemon was not ready within ${READY_TIMEOUT_MS / 1000}s, and has been stopped. The end of ${path.relative(ROOT_DIR, logFile)}:\n\n${tail(logFile)}`
  );
}

function tail(file: string, lines = 20): string {
  return fs
    .readFileSync(file, "utf8")
    .trimEnd()
    .split("\n")
    .slice(-lines)
    .join("\n");
}

function log(message: string): void {
  console.log(`[harness ${new Date().toISOString()}] ${message}`);
}
