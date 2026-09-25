import { stopDaemon } from "../utils/daemon.ts";
import { hasStaleDaemonFiles } from "../utils/state.ts";

/** Stop the running daemon, which shuts its language server down. */
export async function stop(): Promise<void> {
  const stale = hasStaleDaemonFiles();
  const pid = await stopDaemon();

  if (pid !== undefined) {
    console.log(`Stopped the daemon (PID ${pid})`);
  } else if (stale) {
    console.log("No daemon running; removed a stale PID file");
  } else {
    console.log("No daemon running");
  }
}
