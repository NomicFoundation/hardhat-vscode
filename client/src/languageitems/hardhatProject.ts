import { languages, LanguageStatusSeverity } from "vscode";
import { RequestType } from "vscode-languageclient/node";
import { ExtensionState } from "../types";

interface GetSolFileDetailsParams {
  uri: string;
}

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
  if (!extensionState.client) {
    return;
  }

  const response = await extensionState.client.sendRequest(GetSolFileDetails, {
    uri: ensureFilePrefix(params.uri),
  });

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

    extensionState.hardhatConfigStatusItem.command = undefined;

    return;
  }

  if (response.found && response.hardhat) {
    extensionState.hardhatConfigStatusItem.text = response.configDisplayPath;
    extensionState.hardhatConfigStatusItem.command = {
      title: "Open config file",
      command: "vscode.open",
      arguments: [ensureFilePrefix(response.configPath)],
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

function ensureFilePrefix(path: string) {
  if (path.startsWith("file://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `file://${path}`;
  } else {
    return `file:///${path}`;
  }
}
