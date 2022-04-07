import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { decodeUriAndRemoveFilePrefix } from "./index";

export function findProjectBasePathFor(
  { workspaceFolders }: { workspaceFolders: WorkspaceFolder[] },
  uri: string
): string | null {
  for (const workspaceFolder of workspaceFolders) {
    if (uri.startsWith(decodeUriAndRemoveFilePrefix(workspaceFolder.uri))) {
      return workspaceFolder.uri;
    }
  }

  return null;
}
