import { languages, Uri, LanguageStatusSeverity } from "vscode";
import { RequestType } from "vscode-languageclient/node";
import { ExtensionState } from "../types";

type GetSolFileDetailsParams = { uri: Uri };
type GetSolFileDetailsResponse =
  | { found: false }
  | { found: true; hardhat: false }
  | {
      found: true;
      hardhat: true;
      configPath: string;
      configDisplayPath: string;
    };

const GetSolFileDetails = new RequestType<
  GetSolFileDetailsParams,
  GetSolFileDetailsResponse,
  void
>("solidity/getSolFileDetails");

export async function updateHardhatProjectLanguageItem(
  extensionState: ExtensionState,
  params: GetSolFileDetailsParams
) {
  const response = await extensionState.client.sendRequest(
    GetSolFileDetails,
    params
  );

  if (extensionState.hardhatConfigStatusItem === null) {
    const statusItem = languages.createLanguageStatusItem(
      "hardhat-config-file",
      {
        language: "solidity",
      }
    );

    extensionState.hardhatConfigStatusItem = statusItem;
  }

  if (!response.found || !response.hardhat) {
    extensionState.hardhatConfigStatusItem.severity =
      LanguageStatusSeverity.Warning;
    extensionState.hardhatConfigStatusItem.text =
      "No related Hardhat config file found";

    extensionState.hardhatConfigStatusItem.command = null;

    return;
  }

  if (response.found && response.hardhat) {
    extensionState.hardhatConfigStatusItem.text = response.configDisplayPath;
    extensionState.hardhatConfigStatusItem.command = {
      title: "Open config file",
      command: "vscode.open",
      arguments: [response.configPath],
    };

    return;
  }

  return clearHardhatConfigState(extensionState);
}

export function clearHardhatConfigState(extensionState: ExtensionState): void {
  if (extensionState.hardhatConfigStatusItem === null) {
    return;
  }

  extensionState.hardhatConfigStatusItem.dispose();
  extensionState.hardhatConfigStatusItem = null;
}
