import * as Sentry from "@sentry/node";
import type { Transaction } from "@sentry/types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as tracing from "@sentry/tracing";
import { isTelemetryEnabled } from "@utils/serverStateUtils";
import { ServerState } from "../types";
import { Analytics } from "../analytics/types";
import { Telemetry, TrackingResult } from "./types";

const SENTRY_CLOSE_TIMEOUT = 2000;

export class SentryServerTelemetry implements Telemetry {
  private dsn: string;
  private serverState: ServerState | null;
  private analytics: Analytics;
  private actionTaken: boolean;
  private heartbeatInterval: NodeJS.Timeout | null;
  private heartbeatPeriod: number;

  constructor(dsn: string, heartbeatPeriod: number, analytics: Analytics) {
    this.dsn = dsn;
    this.heartbeatPeriod = heartbeatPeriod;
    this.serverState = null;
    this.analytics = analytics;

    this.actionTaken = true;
    this.heartbeatInterval = null;
  }

  public init(
    machineId: string | undefined,
    extensionName: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState
  ) {
    this.serverState = serverState;

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!tracing) {
      throw new Error("Tracing not loaded");
    }

    Sentry.init({
      dsn: this.dsn,
      tracesSampleRate: serverState.env === "development" ? 1 : 0.01,
      release:
        extensionName !== undefined && extensionVersion !== undefined
          ? `${extensionName}@${extensionVersion}`
          : undefined,
      environment: serverState.env,
      initialScope: {
        user: { id: machineId },
        tags: {
          component: "lsp",
        },
      },
      beforeSend: (event) => (isTelemetryEnabled(serverState) ? event : null),
    });

    this.analytics.init(machineId, extensionVersion, serverState);

    this.enableHeartbeat();
  }

  public captureException(err: unknown) {
    Sentry.captureException(err);
  }

  public async trackTiming<T>(
    taskName: string,
    action: (transaction: Transaction) => Promise<TrackingResult<T>>
  ): Promise<T | null> {
    const transaction = this.startTransaction({ op: "task", name: taskName });
    this.actionTaken = true;

    try {
      const trackingResult = await action(transaction);

      transaction.setStatus(trackingResult.status);

      return trackingResult.result;
    } catch (err) {
      this.serverState?.logger.error(err);
      transaction.setStatus("internal_error");
      return null;
    } finally {
      transaction.finish();
    }
  }

  public trackTimingSync<T>(
    taskName: string,
    action: (transaction: Transaction) => TrackingResult<T>
  ): T | null {
    const transaction = this.startTransaction({ op: "task", name: taskName });
    this.actionTaken = true;

    try {
      const trackingResult = action(transaction);

      transaction.setStatus(trackingResult.status);

      return trackingResult.result;
    } catch (err) {
      this.serverState?.logger.error(err);
      transaction.setStatus("internal_error");
      return null;
    } finally {
      transaction.finish();
    }
  }

  public startTransaction({
    op,
    name,
  }: {
    op: string;
    name: string;
  }): Transaction {
    const transaction = Sentry.startTransaction({
      op,
      name,
    });

    Sentry.getCurrentHub().configureScope((scope) =>
      scope.setSpan(transaction)
    );

    return transaction;
  }

  public enableHeartbeat(): void {
    this.heartbeatInterval = setInterval(
      () => this._pulse(),
      this.heartbeatPeriod
    );
  }

  public close(): Promise<boolean> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    return Sentry.close(SENTRY_CLOSE_TIMEOUT);
  }

  private async _pulse(): Promise<void> {
    if (!this.actionTaken) {
      return;
    }

    this.actionTaken = false;
    return this.analytics.sendPageView("heartbeat");
  }
}
