import { WorkspaceFileRetriever } from "@utils/WorkspaceFileRetriever";
import { ServerState } from "../../types";
import { indexWorkspaceFolders } from "./indexWorkspaceFolders";
import { removeWorkspaceFolders } from "./removeWorkspaceFolders";

export const onInitialized = (
  serverState: ServerState,
  workspaceFileRetriever: WorkspaceFileRetriever
) => {
  const { logger } = serverState;

  // set up listener for workspace folder changes
  return async () => {
    logger.trace("onInitialized");

    if (serverState.hasWorkspaceFolderCapability) {
      serverState.connection.workspace.onDidChangeWorkspaceFolders((e) => {
        if (e.added.length > 0) {
          return indexWorkspaceFolders(
            serverState,
            workspaceFileRetriever,
            e.added
          );
        }

        if (e.removed.length > 0) {
          return removeWorkspaceFolders(serverState, e.removed);
        }
      });
    }

    // index folders
    await serverState.telemetry.trackTiming("indexing", async () => {
      await indexWorkspaceFolders(
        serverState,
        workspaceFileRetriever,
        serverState.workspaceFoldersToIndex
      );
      serverState.indexingFinished = true;

      return { status: "ok", result: null };
    });
  };
};
