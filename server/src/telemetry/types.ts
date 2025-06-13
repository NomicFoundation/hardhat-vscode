import { Primitive, SpanStatus } from "@sentry/core";
import { ServerState } from "../types";

export interface TrackingResult<T> {
  status: SpanStatus;
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
    action: () => Promise<TrackingResult<T>>,
    tags?: Record<string, Primitive>
  ): Promise<T | null>;
  trackTimingSync<T>(
    taskName: string,
    action: () => TrackingResult<T>,
    tags?: Record<string, Primitive>
  ): T | null;
  enableHeartbeat(): void;
  close(): Promise<boolean>;
}
