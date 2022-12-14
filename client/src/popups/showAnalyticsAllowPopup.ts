import {
  workspace,
  window,
  ExtensionContext,
  ConfigurationTarget,
} from "vscode";

export async function showAnalyticsAllowPopup({
  context,
}: {
  context: ExtensionContext;
}): Promise<void> {
  const shownTelemetryMessage = context.globalState.get<boolean>(
    "shownTelemetryMessage"
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

  const isAccepted = item === "Accept" ? true : false;

  const config = workspace.getConfiguration("hardhat");

  await config.update("telemetry", isAccepted, ConfigurationTarget.Global);

  await context.globalState.update("shownTelemetryMessage", true);
}
