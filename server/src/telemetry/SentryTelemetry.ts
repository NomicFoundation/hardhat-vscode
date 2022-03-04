import * as Sentry from "@sentry/node";
import { isTelemetryEnabled } from "@utils/serverStateUtils";
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
    machineId: string | undefined,
    extensionName: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState
  ) {
    this.serverState = serverState;

    Sentry.init({
      dsn: this.dsn,
      tracesSampleRate: 0.1,
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
  }

  captureException(err: unknown) {
    Sentry.captureException(err);
  }

  close(): Promise<boolean> {
    return Sentry.close(SENTRY_CLOSE_TIMEOUT);
  }
}
