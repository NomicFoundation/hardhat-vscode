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

  if (shownTelemetryMessage) {
    return;
  }

  const item = await window.showInformationMessage(
    "Help us improve the Hardhat for Visual Studio Code extension with anonymous crash reports & basic usage data?",
    { modal: true },
    "Accept",
    "Decline"
  );

  const isAccepted = item === "Accept" ? true : false;

  const config = workspace.getConfiguration("hardhat");

  config.update("telemetry", isAccepted, ConfigurationTarget.Global);

  context.globalState.update("shownTelemetryMessage", true);
}
