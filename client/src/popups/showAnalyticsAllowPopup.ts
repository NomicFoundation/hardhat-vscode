import {
  workspace,
  window,
  ExtensionContext,
  ConfigurationTarget,
} from "vscode";

const PREVIOUSLY_SHOWN_TELEMETRY_LABEL = "previouslyShownTelemetryMessage";

export async function showAnalyticsAllowPopup({
  context,
}: {
  context: ExtensionContext;
}): Promise<void> {
  // TODO: remove this once we are happy we have most people reconfirmed
  await context.globalState.update("shownTelemetryMessage", undefined);

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

  const isAccepted = item === "Accept" ? true : false;

  const config = workspace.getConfiguration("solidity");

  await config.update("telemetry", isAccepted, ConfigurationTarget.Global);

  await context.globalState.update(PREVIOUSLY_SHOWN_TELEMETRY_LABEL, true);
}
