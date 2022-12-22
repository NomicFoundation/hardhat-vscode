import vscode, { TextDocument } from "vscode";
import { ExtensionState } from "../types";
import { findHardhatDirForFile } from "../utils/workspace";
import { indexHardhatProjects } from "./indexHardhatProjects";

export function setupWorkspaceHooks(state: ExtensionState) {
  state.listenerDisposables.push(
    vscode.workspace.onDidOpenTextDocument(onDidOpenTextDocument(state))
  );

  state.listenerDisposables.push(
    vscode.workspace.onDidChangeWorkspaceFolders(
      onDidChangeWorkspaceFolders(state)
    )
  );
}

function onDidOpenTextDocument(state: ExtensionState) {
  return async (e: TextDocument) => {
    const folder = findHardhatDirForFile(state, e.uri.fsPath);

    await vscode.commands.executeCommand(
      "setContext",
      "solidity.inHardhatProject",
      folder !== undefined
    );
  };
}

function onDidChangeWorkspaceFolders(state: ExtensionState) {
  return async () => {
    await indexHardhatProjects(state);
  };
}
