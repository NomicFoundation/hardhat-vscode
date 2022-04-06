import { ServerState } from "../../types";

export const onInitialized = (serverState: ServerState) => {
  const { logger } = serverState;

  return () => {
    logger.trace("onInitialized");

    if (serverState.workspaceFolders.length === 0) {
      throw new Error("Workspace folders not set");
    }

    serverState.telemetry.trackTimingSync("indexing", () => {
      serverState.analyzer.init(serverState.workspaceFolders);
    });

    if (serverState.hasWorkspaceFolderCapability) {
      serverState.connection.workspace.onDidChangeWorkspaceFolders(() => {
        logger.trace("Workspace folder change event received.");
      });
    }

    logger.info("Language server ready");
  };
};
