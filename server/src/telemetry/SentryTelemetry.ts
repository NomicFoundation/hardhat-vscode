import * as Sentry from "@sentry/node";
import { ServerState } from "../types";
import { Telemetry } from "./types";

const SENTRY_CLOSE_TIMEOUT = 2000;

export class SentryTelemetry implements Telemetry {
  dsn: string;
  serverState: ServerState | null;

  constructor(dsn: string) {
    this.dsn = dsn;
    this.serverState = null;
  }

  init(
    trackingId: string | undefined,
    release: string | undefined,
    serverState: ServerState
  ) {
    this.serverState = serverState;

    Sentry.init({
      dsn: this.dsn,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 0.1,
      release: release,
      environment: serverState.env,
      initialScope: {
        user: { id: trackingId },
      },
      beforeSend: (event) => (serverState.telemetryEnabled ? event : null),
    });
  }

  captureException(err: unknown) {
    if (this.serverState?.telemetryEnabled !== true) {
      return;
    }

    Sentry.captureException(err);
  }

  close(): Promise<boolean> {
    return Sentry.close(SENTRY_CLOSE_TIMEOUT);
  }
}
