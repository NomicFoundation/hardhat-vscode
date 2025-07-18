import { ExtensionContext } from "vscode";
import { showSoliditySurveyPopup } from "./popups/showSoliditySurveyPopup";
import { warnOnOtherSolidityExtensions } from "./popups/warnOnOtherSolidityExtensions";
import { indexHardhatProjects } from "./setup/indexHardhatProjects";
import { setupCommands } from "./setup/setupCommands";
import { setupExtensionState } from "./setup/setupExtensionState";
import { setupLanguageServerHooks } from "./setup/setupLanguageServerHooks";
import { setupTaskProvider } from "./setup/setupTaskProvider";
import { setupWorkspaceHooks } from "./setup/setupWorkspaceHooks";
import { ExtensionState } from "./types";

let extensionState: ExtensionState | null = null;

const SENTRY_DSN =
  "https://9d1e887190db400791c77d9bb5a154fd@o385026.ingest.sentry.io/5469451";

export async function activate(context: ExtensionContext) {
  extensionState = setupExtensionState(context, { sentryDsn: SENTRY_DSN });

  try {
    const { logger } = extensionState;

    logger.info("Solidity by Nomic Foundation Starting ...");
    logger.info(`env: ${extensionState.env}`);

    await indexHardhatProjects(extensionState);

    await setupLanguageServerHooks(extensionState);
    setupTaskProvider(extensionState);
    await setupCommands(extensionState);
    setupWorkspaceHooks(extensionState);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    showSoliditySurveyPopup(extensionState);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    warnOnOtherSolidityExtensions(extensionState);

    return {
      isReady: () => !!extensionState?.client?.initializeResult,
    };
  } catch (error) {
    extensionState.logger.error(error);
    throw error;
  }
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
