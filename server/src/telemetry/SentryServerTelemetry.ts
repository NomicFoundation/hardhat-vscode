/* istanbul ignore file: external system */
import * as Sentry from "@sentry/node";
import type { Primitive, Transaction } from "@sentry/types";
import * as tracing from "@sentry/tracing";
import { ServerState } from "../types";
import { Analytics } from "../analytics/types";
import { Telemetry, TrackingResult } from "./types";

import { sentryEventFilter } from "./sentryEventFilter";

const SENTRY_CLOSE_TIMEOUT = 2000;

export class SentryServerTelemetry implements Telemetry {
  private dsn: string;
  private serverState: ServerState | null;
  private analytics: Analytics;
  private actionTaken: boolean;
  private heartbeatInterval: NodeJS.Timeout | null;
  private heartbeatPeriod: number;

  constructor(
    dsn: string,
    heartbeatPeriod: number,
    analytics: Analytics,
    public eventFilter = sentryEventFilter
  ) {
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
    serverState: ServerState,
    clientName: string | undefined
  ) {
    this.serverState = serverState;

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!tracing) {
      throw new Error("Tracing not loaded");
    }

    Sentry.init({
      dsn: this.dsn,
      tracesSampleRate: serverState.env === "development" ? 1 : 0.001,
      release:
        extensionName !== undefined && extensionVersion !== undefined
          ? `${extensionName}@${extensionVersion}`
          : undefined,
      environment: serverState.env,
      initialScope: {
        user: { id: machineId },
        tags: {
          component: "lsp",
          client: clientName,
        },
      },

      beforeSend: (event) =>
        serverState.telemetryEnabled && this.eventFilter(event) ? event : null,

      beforeSendTransaction: (transactionEvent) =>
        serverState.telemetryEnabled ? transactionEvent : null,
    });

    this.analytics.init(machineId, extensionVersion, serverState, clientName);

    this.enableHeartbeat();
  }

  public captureException(err: unknown) {
    Sentry.captureException(err);
  }

  public async trackTiming<T>(
    taskName: string,
    action: (transaction: Transaction) => Promise<TrackingResult<T>>,
    tags?: Record<string, Primitive>
  ): Promise<T | null> {
    const transaction = this.startTransaction({
      op: "task",
      name: taskName,
      tags,
    });
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
    action: (transaction: Transaction) => TrackingResult<T>,
    tags?: Record<string, Primitive>
  ): T | null {
    const transaction = this.startTransaction({
      op: "task",
      name: taskName,
      tags,
    });
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
    tags,
  }: {
    op: string;
    name: string;
    tags?: Record<string, Primitive>;
  }): Transaction {
    const transaction = Sentry.startTransaction({
      op,
      name,
      tags,
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
