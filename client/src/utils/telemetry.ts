import { env, workspace } from "vscode";

export function isGlobalTelemetryEnabled() {
  return env.isTelemetryEnabled;
}

export function isHardhatTelemetryEnabled() {
  return (
    workspace.getConfiguration("solidity").get<boolean>("telemetry") ?? false
  );
}

export function isTelemetryEnabled() {
  return isGlobalTelemetryEnabled() && isHardhatTelemetryEnabled();
}
