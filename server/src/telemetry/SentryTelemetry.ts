import * as Sentry from "@sentry/node";
import { Transaction } from "@sentry/types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as tracing from "@sentry/tracing";
import { isTelemetryEnabled } from "@utils/serverStateUtils";
import { ServerState } from "../types";
import { Telemetry } from "./types";
import { Analytics } from "analytics/types";

const SENTRY_CLOSE_TIMEOUT = 2000;

export class SentryTelemetry implements Telemetry {
  dsn: string;
  serverState: ServerState | null;
  analytics: Analytics;
  actionTaken: boolean;
  heartbeatInterval: NodeJS.Timeout | null;
  heartbeatPeriod: number;

  constructor(dsn: string, heartbeatPeriod: number, analytics: Analytics) {
    this.dsn = dsn;
    this.heartbeatPeriod = heartbeatPeriod;
    this.serverState = null;
    this.analytics = analytics;

    this.actionTaken = true;
    this.heartbeatInterval = null;
  }

  init(
    machineId: string | undefined,
    extensionName: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState
  ) {
    this.serverState = serverState;

    if (!tracing) {
      // eslint-disable-next-line no-console
      console.error("Tracing not enabled");
    }

    Sentry.init({
      dsn: this.dsn,
      tracesSampleRate: serverState.env === "development" ? 1 : 0.01,
      release:
        extensionName && extensionVersion
          ? `${extensionName}@${extensionVersion}`
          : undefined,
      environment: serverState.env,
      initialScope: {
        user: { id: machineId },
      },
      beforeSend: (event) => (isTelemetryEnabled(serverState) ? event : null),
    });

    this.analytics.init(machineId, extensionVersion, serverState);
  }

  captureException(err: unknown) {
    Sentry.captureException(err);
  }

  public trackTimingSync<T>(taskName: string, action: () => T): T {
    const transaction = this.startTransaction({ op: "task", name: taskName });
    this.actionTaken = true;

    const result = action();

    transaction.finish();

    return result;
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
      () => this.pulse(),
      this.heartbeatPeriod
    );
  }

  private async pulse(): Promise<void> {
    if (!this.actionTaken) {
      return;
    }

    this.actionTaken = false;
    return this.analytics.sendPageView("heartbeat");
  }

  close(): Promise<boolean> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    return Sentry.close(SENTRY_CLOSE_TIMEOUT);
  }
}
