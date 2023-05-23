import {
  DidChangeWatchedFilesParams,
  FileChangeType,
} from "vscode-languageserver";
import { ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import { clearDiagnostics } from "../validation/validate";

export function onDidChangeWatchedFiles(serverState: ServerState) {
  return async (params: DidChangeWatchedFilesParams) => {
    // Index new solidity files
    for (const change of params.changes) {
      if (
        change.uri.endsWith(".sol") &&
        change.type === FileChangeType.Deleted
      ) {
        const unixStyleUri = toUnixStyle(change.uri);

        await clearDiagnostics(serverState, unixStyleUri);
      }
    }

    // Notify all registered projects of the file changes
    for (const project of Object.values(serverState.projects)) {
      await project.onWatchedFilesChanges(params);
    }
  };
}
