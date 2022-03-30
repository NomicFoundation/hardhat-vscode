import { ExtensionContext } from "vscode";
import { showAnalyticsAllowPopup } from "./popups/showAnalyticsAllowPopup";
import { warnOnOtherSolidityExtensions } from "./popups/warnOnOtherSolidityExtensions";
import { setupExtensionState } from "./setup/setupExtensionState";
import { setupFormatterHook } from "./setup/setupFormatterHook";
import { setupLanguageServerHooks } from "./setup/setupLanguageServerHooks";
import { ExtensionState } from "./types";

let extensionState: ExtensionState | null = null;

const SENTRY_DSN =
  "https://9d1e887190db400791c77d9bb5a154fd@o385026.ingest.sentry.io/5469451";

export function activate(context: ExtensionContext) {
  extensionState = setupExtensionState(context, { sentryDsn: SENTRY_DSN });

  const { logger } = extensionState;

  logger.info("Hardhat for Visual Studio Code Starting ...");
  logger.info(`env: ${extensionState.env}`);

  warnOnOtherSolidityExtensions(extensionState);
  showAnalyticsAllowPopup(extensionState);

  setupFormatterHook(extensionState);
  setupLanguageServerHooks(extensionState);
}

export function deactivate(): Thenable<void> {
  if (!extensionState) {
    return;
  }

  extensionState.listenerDisposables.forEach((disposable) =>
    disposable.dispose()
  );

  const promises: Thenable<void>[] = [];

  if (extensionState.client) {
    extensionState.client.stop();
  }

  const telemetryClosePromise = extensionState.telemetry.close();

  return Promise.all([...promises, telemetryClosePromise]).then(
    () => undefined
  );
}
