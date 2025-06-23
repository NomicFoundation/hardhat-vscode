import {
  workspace,
  window,
  ExtensionContext,
  ConfigurationTarget,
  ExtensionMode,
} from "vscode";

const PREVIOUSLY_SHOWN_TELEMETRY_LABEL =
  "previouslyShownTelemetryMessage-2025-06-23";

export async function showAnalyticsAllowPopup({
  context,
}: {
  context: ExtensionContext;
}): Promise<void> {
  if (context.extensionMode === ExtensionMode.Test) {
    // Dialog messages are prohibited in tests:
    // https://github.com/microsoft/vscode/blob/36fefc828e4c496a7bbb64c63f3eb3052a650f8f/src/vs/workbench/services/dialogs/common/dialogService.ts#L56
    return;
  }

  const shownTelemetryMessage = context.globalState.get<boolean>(
    PREVIOUSLY_SHOWN_TELEMETRY_LABEL
  );

  if (shownTelemetryMessage === true) {
    return;
  }

  const item = await window.showInformationMessage(
    "Help us improve the Solidity by Nomic Foundation extension with anonymous crash reports & basic usage data?",
    { modal: true },
    "Accept",
    "Decline"
  );

  // User cancelled, don't change config
  if (item === undefined) {
    return;
  }

  const isAccepted = item === "Accept" ? true : false;

  const config = workspace.getConfiguration("solidity");

  await config.update("telemetry", isAccepted, ConfigurationTarget.Global);

  await context.globalState.update(PREVIOUSLY_SHOWN_TELEMETRY_LABEL, true);
}
