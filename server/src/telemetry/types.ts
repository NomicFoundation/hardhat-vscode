import { ServerState } from "../types";

export interface Telemetry {
  init(
    machineId: string | undefined,
    extensionName: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState
  ): void;
  captureException(err: unknown): void;
  close(): Promise<boolean>;
}
