import { Transaction } from "@sentry/types";
import { ServerState } from "../types";

export interface Telemetry {
  init(
    machineId: string | undefined,
    extensionName: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState
  ): void;
  captureException(err: unknown): void;
  trackTimingSync<T>(taskName: string, action: () => T): T;
  startTransaction({ op, name }: { op: string; name: string }): Transaction;
  enableHeartbeat(): void;
  close(): Promise<boolean>;
}
