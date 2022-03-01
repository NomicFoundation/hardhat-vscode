import { ServerState } from "../types";

export interface Telemetry {
  init(
    trackingId: string | undefined,
    release: string | undefined,
    serverState: ServerState
  ): void;
  captureException(err: unknown): void;
  close(): Promise<boolean>;
}
