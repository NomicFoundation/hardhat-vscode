import * as Sentry from "@sentry/node";
import { ExtensionState } from "../types";
import { Telemetry } from "./types";

const SENTRY_CLOSE_TIMEOUT = 2000;

export class SentryClientTelemetry implements Telemetry {
  private dsn: string;
  private extensionState: ExtensionState | null;

  constructor(dsn: string) {
    this.dsn = dsn;
    this.extensionState = null;
  }

  init(extensionState: ExtensionState) {
    this.extensionState = extensionState;

    Sentry.init({
      dsn: this.dsn,
      tracesSampleRate: this.extensionState.env === "development" ? 1 : 0.01,
      release: `${this.extensionState.name}@${this.extensionState.version}`,
      environment: this.extensionState.env,
      initialScope: {
        user: { id: this.extensionState.machineId },
        tags: {
          component: "ext",
        },
      },
      integrations: (defaults) =>
        defaults.filter((integration) => {
          return integration.name !== "OnUncaughtException";
        }),
      beforeSend: (event) =>
        isTelemetryEnabled(this.extensionState) ? event : null,
    });
  }

  captureException(err: unknown): void {
    Sentry.captureException(err);
  }

  close(): Promise<boolean> {
    return Sentry.close(SENTRY_CLOSE_TIMEOUT);
  }
}

function isTelemetryEnabled(extensionState: ExtensionState | undefined | null) {
  return (
    extensionState &&
    extensionState.globalTelemetryEnabled &&
    extensionState.hardhatTelemetryEnabled
  );
}
