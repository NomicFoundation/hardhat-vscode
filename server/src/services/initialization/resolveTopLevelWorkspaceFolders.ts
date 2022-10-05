import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { ServerState } from "../../types";

/**
 * Workspaces can be nested, we are only concerned with new folders
 * that are top level for indexing.
 */
export function resolveTopLevelWorkspaceFolders(
  serverState: ServerState,
  addedWorkspaceFolders: WorkspaceFolder[]
): WorkspaceFolder[] {
  const addedUris = addedWorkspaceFolders.map((awf) => awf.uri);

  const rootAddedWorkspaces = addedWorkspaceFolders.filter(
    (awf) =>
      !addedUris.some((uri) => uri !== awf.uri && awf.uri.startsWith(uri))
  );

  const notAlreadyProcessed = rootAddedWorkspaces.filter(
    (awf) =>
      !serverState.indexedWorkspaceFolders.some(
        (wf) => awf.uri === wf.uri || awf.uri.startsWith(wf.uri)
      )
  );

  return notAlreadyProcessed;
}
