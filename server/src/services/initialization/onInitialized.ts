import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { ServerState } from "../../types";
import { indexWorkspaceFolders } from "./indexWorkspaceFolders";
import { removeWorkspaceFolders } from "./removeWorkspaceFolders";

export const onInitialized = (
  serverState: ServerState,
  workspaceFileRetriever: WorkspaceFileRetriever
) => {
  const { logger } = serverState;

  return async () => {
    logger.trace("onInitialized");

    if (serverState.hasWorkspaceFolderCapability) {
      serverState.connection.workspace.onDidChangeWorkspaceFolders((e) => {
        logger.trace(
          `Workspace folder change event received. ${e.added} ${e.removed}`
        );

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

    await serverState.telemetry.trackTimingSync("indexing", () =>
      indexWorkspaceFolders(
        { ...serverState, workspaceFolders: [] },
        workspaceFileRetriever,
        serverState.workspaceFolders
      )
    );

    logger.info("Language server ready");
  };
};
