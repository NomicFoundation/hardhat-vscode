import { ServerState } from "../types";

export function isTelemetryEnabled(
  serverState: ServerState | undefined | null
): boolean {
  return (
    serverState !== undefined &&
    serverState !== null &&
    serverState.globalTelemetryEnabled &&
    serverState.hardhatTelemetryEnabled
  );
}
