import vscode from "vscode";

export function getRootPath() {
  if (
    vscode.workspace.workspaceFolders === undefined ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    throw new Error("No workspace folders");
  }

  return vscode.workspace.workspaceFolders[0].uri.fsPath;
}
