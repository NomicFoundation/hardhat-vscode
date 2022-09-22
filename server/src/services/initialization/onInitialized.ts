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

  // set up listener for workspace folder changes
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

    // index folders
    await serverState.telemetry.trackTiming("indexing", async () => {
      await indexWorkspaceFolders(
        { ...serverState, workspaceFolders: [] },
        workspaceFileRetriever,
        serverState.workspaceFolders
      );
      serverState.indexingFinished = true;

      return { status: "ok", result: null };
    });

    // set up validation workers
    serverState.telemetry.trackTimingSync("worker setup", () => {
      setupWorkerProcesses(serverState);

      return { status: "ok", result: null };
    });
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
