import { ExtensionContext } from "vscode";
import { showAnalyticsAllowPopup } from "./popups/showAnalyticsAllowPopup";
import { showSoliditySurveyPopup } from "./popups/showSoliditySurveyPopup";
import { warnOnOtherSolidityExtensions } from "./popups/warnOnOtherSolidityExtensions";
import { indexHardhatProjects } from "./setup/indexHardhatProjects";
import { setupCommands } from "./setup/setupCommands";
import { setupExtensionState } from "./setup/setupExtensionState";
import { setupFormatterHook } from "./setup/setupFormatterHook";
import { setupLanguageServerHooks } from "./setup/setupLanguageServerHooks";
import { setupTaskProvider } from "./setup/setupTaskProvider";
import { setupWorkspaceHooks } from "./setup/setupWorkspaceHooks";
import { ExtensionState } from "./types";

let extensionState: ExtensionState | null = null;

const SENTRY_DSN =
  "https://9d1e887190db400791c77d9bb5a154fd@o385026.ingest.sentry.io/5469451";

export async function activate(context: ExtensionContext) {
  extensionState = setupExtensionState(context, { sentryDsn: SENTRY_DSN });

  const { logger } = extensionState;

  logger.info("Hardhat for Visual Studio Code Starting ...");
  logger.info(`env: ${extensionState.env}`);

  await indexHardhatProjects(extensionState);

  setupFormatterHook(extensionState);
  setupLanguageServerHooks(extensionState);
  setupTaskProvider(extensionState);
  await setupCommands(extensionState);
  setupWorkspaceHooks(extensionState);

  // We don't want to block for user input, analytics will be turned
  // off from users until they agree.
  //
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  showAnalyticsAllowPopup(extensionState);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  showSoliditySurveyPopup(extensionState); // TODO: Remove this after 2023-01-07
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  warnOnOtherSolidityExtensions(extensionState);

  return {
    isReady: () => !!extensionState?.client?.initializeResult,
  };
}

export function deactivate() {
  if (!extensionState) {
    return;
  }

  extensionState.listenerDisposables.forEach((disposable) =>
    disposable.dispose()
  );

  const clientStopPromise =
    extensionState.client !== null
      ? extensionState.client.stop()
      : Promise.resolve();

  const telemetryClosePromise = extensionState.telemetry.close();

  return Promise.all([clientStopPromise, telemetryClosePromise]);
}
