import { isHardhatProject } from "@analyzer/HardhatProject";
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

    await serverState.telemetry.trackTiming("indexing", async () => {
      await indexWorkspaceFolders(
        { ...serverState, workspaceFolders: [] },
        workspaceFileRetriever,
        serverState.workspaceFolders
      );

      return { status: "ok", result: null };
    });

    serverState.telemetry.trackTimingSync("worker setup", () => {
      setupWorkerProcesses(serverState);

      return { status: "ok", result: null };
    });

    logger.info("Language server ready");
  };
};

function setupWorkerProcesses(serverState: ServerState) {
  const workerProcesses = serverState.workerProcesses;
  for (const project of Object.values(serverState.projects)) {
    if (project.basePath in workerProcesses) {
      continue;
    }

    if (!isHardhatProject(project)) {
      continue;
    }

    const workerProcess = serverState.compProcessFactory(
      project,
      serverState.logger,
      serverState.connection
    );

    workerProcesses[project.basePath] = workerProcess;

    workerProcess.init();
  }
}
