// eslint-disable-next-line @typescript-eslint/naming-convention
import * as Sentry from "@sentry/node";
import { getDefaultIntegrations, defaultStackParser } from "@sentry/node";
import { ExtensionState } from "../types";
import { isTelemetryEnabled } from "../utils/telemetry";
import { Telemetry } from "./types";
import { anonymizeEvent } from "./anonymization";

const SENTRY_CLOSE_TIMEOUT = 2000;

export class SentryClientTelemetry implements Telemetry {
  private dsn: string;
  private extensionState: ExtensionState | null;
  private client?: Sentry.NodeClient;

  constructor(dsn: string) {
    this.dsn = dsn;
    this.extensionState = null;
  }

  public init(extensionState: ExtensionState) {
    this.extensionState = extensionState;

    const integrations = getDefaultIntegrations({}).filter(
      (defaultIntegration) => {
        return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
          defaultIntegration.name
        );
      }
    );

    const client = new Sentry.NodeClient({
      dsn: this.dsn,
      transport: Sentry.makeNodeTransport,
      stackParser: defaultStackParser,
      integrations,
      environment: this.extensionState.env,
      release: `${this.extensionState.name}@${this.extensionState.version}`,
      beforeSend: (event) =>
        isTelemetryEnabled() ? anonymizeEvent(event) : null,
    });
    Sentry.getGlobalScope().setUser({ id: this.extensionState.machineId });
    Sentry.getGlobalScope().setTag("component", "ext");
    Sentry.getGlobalScope().setTag("isHandled", true);

    client.init();

    process.on("uncaughtException", (err) => {
      this._processUnhandledError(err);
    });

    process.on("unhandledRejection", (reason) => {
      const err = reason instanceof Error ? reason : new Error(String(reason));
      this._processUnhandledError(err);
    });

    this.client = client;
  }

  private _processUnhandledError(err: Error) {
    const extensionName = "nomicfoundation.hardhat-solidity";
    const client = this.client;
    if ((err.stack ?? "").includes(extensionName)) {
      Sentry.withScope(function (scope) {
        scope.setTag("isHandled", false);
        client?.captureException(err);
      });
    }
  }

  public captureException(err: unknown): void {
    this.client?.captureException(err);
  }

  public async close(): Promise<boolean> {
    return this.client?.close(SENTRY_CLOSE_TIMEOUT) ?? true;
  }
}
