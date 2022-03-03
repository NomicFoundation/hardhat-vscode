import { ServerState } from "../types";

export function isTelemetryEnabled(
  serverState: ServerState | undefined | null
) {
  return (
    serverState &&
    serverState.globalTelemetryEnabled &&
    serverState.hardhatTelemetryEnabled
  );
}
