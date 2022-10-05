import { WorkspaceFolder } from "vscode-languageserver";
import { ServerState } from "../../types";

export function removeWorkspaceFolders(
  serverState: ServerState,
  removed: WorkspaceFolder[]
) {
  // TODO: we should remove the projects and
  // sol files from under the workspace folder
  // as well as remove the folder itself.
  // However this means dealing with nested
  // workspace folder removal (we shouldn't
  // projects and files that are still part
  // of a parent workspace). This is punted on
  // for the moment.
  serverState.indexedWorkspaceFolders =
    serverState.indexedWorkspaceFolders.filter(
      (wf) => !removed.some((r) => r.uri === wf.uri)
    );
}
