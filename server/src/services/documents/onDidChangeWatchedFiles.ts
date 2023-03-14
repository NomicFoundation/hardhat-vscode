import {
  DidChangeWatchedFilesParams,
  FileChangeType,
} from "vscode-languageserver";
import { ServerState } from "../../types";
import { decodeUriAndRemoveFilePrefix } from "../../utils";
import { clearDiagnostics } from "../validation/validate";

export function onDidChangeWatchedFiles(serverState: ServerState) {
  return async (params: DidChangeWatchedFilesParams) => {
    // Normalize file uris
    const normalizedParams = {
      changes: params.changes.map((change) => ({
        ...change,
        uri: decodeUriAndRemoveFilePrefix(change.uri),
      })),
    };

    // Index new solidity files
    for (const change of normalizedParams.changes) {
      if (
        change.uri.endsWith(".sol") &&
        change.type === FileChangeType.Deleted
      ) {
        delete serverState.solFileIndex[change.uri];
        await clearDiagnostics(serverState, change.uri);
      }
    }

    // Notify all registered projects of the file changes
    for (const project of Object.values(serverState.projects)) {
      await project.onWatchedFilesChanges(normalizedParams);
    }
  };
}
