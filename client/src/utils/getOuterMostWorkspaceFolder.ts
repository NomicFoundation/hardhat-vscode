import { workspace, WorkspaceFolder, Uri } from "vscode";

let _sortedWorkspaceFolders: string[] | undefined;

workspace.onDidChangeWorkspaceFolders(
  () => (_sortedWorkspaceFolders = undefined)
);

export function getOuterMostWorkspaceFolder(
  folder: WorkspaceFolder
): WorkspaceFolder {
  const sorted = sortedWorkspaceFolders();

  for (const element of sorted) {
    let uri = folder.uri.toString();

    if (uri.charAt(uri.length - 1) !== "/") {
      uri = uri + "/";
    }

    if (uri.startsWith(element)) {
      return workspace.getWorkspaceFolder(Uri.parse(element));
    }
  }

  return folder;
}

function sortedWorkspaceFolders(): string[] {
  if (_sortedWorkspaceFolders === void 0) {
    _sortedWorkspaceFolders = workspace.workspaceFolders
      ? workspace.workspaceFolders
          .map((folder) => {
            let result = folder.uri.toString();

            if (result.charAt(result.length - 1) !== "/") {
              result = result + "/";
            }

            return result;
          })
          .sort((a, b) => {
            return a.length - b.length;
          })
      : [];
  }

  return _sortedWorkspaceFolders;
}
