import { WorkspaceFileRetriever } from "@utils/WorkspaceFileRetriever";
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

    // set up listener for workspace folder changes
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

    // Send project info for each indexed file to show status item
    for (const [uri, solFileEntry] of Object.entries(
      serverState.solFileIndex
    )) {
      serverState.connection.sendNotification("custom/file-indexed", {
        uri,
        project: {
          configPath: solFileEntry.project.configPath,
          frameworkName: solFileEntry.project.frameworkName(),
        },
      });
    }
  };
};
