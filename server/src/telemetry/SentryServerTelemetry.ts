/* istanbul ignore file: external system */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as Sentry from "@sentry/node";
import { ServerState } from "../types";
import { Analytics } from "../analytics/types";
import { Telemetry, TrackingResult } from "./types";

import { sentryEventFilter } from "./sentryEventFilter";
import { INTERNAL_ERROR } from "./TelemetryStatus";
import { anonymizeEvent } from "./anonymization";

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
    clientName: string | undefined,
    clientVersion: string | undefined
  ) {
    this.serverState = serverState;

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
        serverState.telemetryEnabled && this.eventFilter(event)
          ? anonymizeEvent(event)
          : null,

      beforeSendTransaction: (transactionEvent) =>
        serverState.telemetryEnabled ? anonymizeEvent(transactionEvent) : null,
    });

    this.analytics.init(
      machineId,
      extensionVersion,
      serverState,
      clientName,
      clientVersion
    );

    this.enableHeartbeat();
  }

  public captureException(err: unknown) {
    Sentry.captureException(err);
  }

  public async trackTiming<T>(
    taskName: string,
    action: () => Promise<TrackingResult<T>>
  ): Promise<T | null> {
    let returnValue: T | null = null;
    this.actionTaken = true;

    await Sentry.startSpan(
      {
        op: taskName,
        name: taskName,
      },
      async (span) => {
        try {
          const trackingResult = await action();
          span.setStatus(trackingResult.status);
          returnValue = trackingResult.result;
        } catch (err) {
          this.serverState?.logger.error(err);
          span.setStatus(INTERNAL_ERROR);
        }
      }
    );

    return returnValue;
  }

  public trackTimingSync<T>(
    taskName: string,
    action: () => TrackingResult<T>
  ): T | null {
    let returnValue: T | null = null;
    this.actionTaken = true;

    Sentry.startSpan(
      {
        op: taskName,
        name: taskName,
      },
      (span) => {
        try {
          const trackingResult = action();
          span.setStatus(trackingResult.status);
          returnValue = trackingResult.result;
        } catch (err) {
          this.serverState?.logger.error(err);
          span.setStatus(INTERNAL_ERROR);
        }
      }
    );

    return returnValue;
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
