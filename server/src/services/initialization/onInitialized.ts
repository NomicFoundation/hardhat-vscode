import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { ServerState } from "../../types";
import { indexWorkspaceFolders } from "./indexWorkspaceFolders";

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

        return indexWorkspaceFolders(
          serverState,
          workspaceFileRetriever,
          e.added
        );
      });
    }

    await serverState.telemetry.trackTimingSync("indexing", () =>
      indexWorkspaceFolders(
        serverState,
        workspaceFileRetriever,
        serverState.workspaceFolders
      )
    );

    logger.info("Language server ready");
  };
};
