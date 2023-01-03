import { SpanStatusType } from "@sentry/tracing";
import type { Primitive, Transaction } from "@sentry/types";
import { ServerState } from "../types";

export interface TrackingResult<T> {
  status: SpanStatusType;
  result: T | null;
}

export interface Telemetry {
  init(
    machineId: string | undefined,
    extensionName: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState,
    clientName: string | undefined
  ): void;
  captureException(err: unknown): void;
  trackTiming<T>(
    taskName: string,
    action: (transaction: Transaction) => Promise<TrackingResult<T>>,
    tags?: Record<string, Primitive>
  ): Promise<T | null>;
  trackTimingSync<T>(
    taskName: string,
    action: (transaction: Transaction) => TrackingResult<T>,
    tags?: Record<string, Primitive>
  ): T | null;
  startTransaction({ op, name }: { op: string; name: string }): Transaction;
  enableHeartbeat(): void;
  close(): Promise<boolean>;
}
