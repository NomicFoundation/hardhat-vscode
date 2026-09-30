// eslint-disable-next-line @typescript-eslint/naming-convention
import * as Sentry from "@sentry/node";
import { getDefaultIntegrations, defaultStackParser } from "@sentry/node";
import { ExtensionState } from "../types";
import { isTelemetryEnabled } from "../utils/telemetry";
import { Telemetry } from "./types";
import { anonymizeEvent } from "./anonymization";

const SENTRY_CLOSE_TIMEOUT = 2000;

/**
 * Default `@sentry/node` integrations the extension does not want.
 *
 * `OnUncaughtException` and `OnUnhandledRejection` install Sentry's own
 * process-level handlers, which report everything the extension host throws,
 * ours or not, and can call `logAndExitProcess`. `_processUnhandledError`
 * below is the deliberate version of the same thing, filtered to this
 * extension. `Console` turns every `console` call in the extension host into
 * a breadcrumb, again regardless of whose it is.
 */
const DISABLED_INTEGRATIONS = [
  "OnUncaughtException",
  "OnUnhandledRejection",
  "Console",
];

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

    if (this.dsn === "") {
      return;
    }

    const integrations = getDefaultIntegrations({}).filter(
      (defaultIntegration) =>
        !DISABLED_INTEGRATIONS.includes(defaultIntegration.name)
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
