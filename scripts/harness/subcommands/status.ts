import path from "node:path";
import { CONTROL_HOST, ping } from "../utils/daemon.ts";
import { ROOT_DIR } from "../utils/paths.ts";
import {
  HARNESS_DIR,
  hasStaleDaemonFiles,
  LOG_FILE,
  recordedWorkspace,
  removeDaemonFiles,
  runningDaemonPid,
} from "../utils/state.ts";

/**
 * Report the daemon and the current workspace. Exits 0 only when a daemon is
 * running and ready, so a script can test for it.
 */
export async function status(): Promise<void> {
  const workspace = recordedWorkspace();

  console.log(`Current workspace: ${workspace?.name ?? "none recorded"}`);

  if (hasStaleDaemonFiles()) {
    removeDaemonFiles();
    console.log("Daemon:            not running (removed a stale PID file)");
    process.exitCode = 1;

    return;
  }

  const pid = runningDaemonPid();

  if (pid === undefined) {
    console.log("Daemon:            not running");
    process.exitCode = 1;

    return;
  }

  const state = await ping();

  if (state === undefined) {
    console.log(`Daemon:            starting (PID ${pid}), not answering yet`);
    process.exitCode = 1;

    return;
  }

  console.log(
    `Daemon:            ${state.ready ? "ready" : "initializing"} (PID ${state.pid})`
  );
  console.log(`Workspace:         ${state.workspace}`);
  console.log(`Control:           http://${CONTROL_HOST}:${state.port}`);
  console.log(`Started:           ${state.startedAt}`);
  console.log(
    `Log:               ${path.relative(ROOT_DIR, path.join(HARNESS_DIR, LOG_FILE))} (--background only)`
  );

  if (!state.ready) {
    process.exitCode = 1;
  }
}
