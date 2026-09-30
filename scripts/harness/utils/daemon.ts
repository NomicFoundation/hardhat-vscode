import { CONTROL_HOST } from "./control.ts";
import {
  type DaemonState,
  HARNESS_DIR,
  readDaemonState,
  removeDaemonFiles,
  runningDaemonPid,
} from "./state.ts";

/**
 * Stop the running daemon, if there is one: SIGTERM, which it handles by
 * shutting the server down, then SIGKILL if it has not exited in time.
 * Clears the daemon's files either way, including stale ones.
 *
 * Returns the PID that was stopped, or undefined if nothing was running.
 */
export async function stopDaemon(
  harnessDir: string = HARNESS_DIR,
  timeoutMs = 10_000
): Promise<number | undefined> {
  const pid = runningDaemonPid(harnessDir);

  if (pid === undefined) {
    removeDaemonFiles(harnessDir);

    return undefined;
  }

  process.kill(pid, "SIGTERM");

  if (!(await waitForExit(pid, timeoutMs))) {
    process.kill(pid, "SIGKILL");
    await waitForExit(pid, timeoutMs);
  }

  removeDaemonFiles(harnessDir);

  return pid;
}

/** True once the process has gone, false if it outlives the timeout. */
export async function waitForExit(
  pid: number,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (!isAlive(pid)) {
      return true;
    }

    await sleep(100);
  }

  return !isAlive(pid);
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
}

/**
 * Ask the running daemon for its state over the control endpoint. Undefined
 * when no daemon is running, or it is not yet listening.
 */
export async function ping(
  harnessDir: string = HARNESS_DIR
): Promise<DaemonState | undefined> {
  const state = readDaemonState(harnessDir);

  if (state === undefined || runningDaemonPid(harnessDir) !== state.pid) {
    return undefined;
  }

  try {
    const response = await fetch(`http://${CONTROL_HOST}:${state.port}/ping`, {
      signal: AbortSignal.timeout(2_000),
    });

    return response.ok ? ((await response.json()) as DaemonState) : undefined;
  } catch {
    return undefined;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
