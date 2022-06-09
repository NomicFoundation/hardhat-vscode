import { ClientTrackingState } from "@common/types";
import { ServerState, WorkerProcess } from "../../types";

export async function invalidateWorkerPreprocessCache(
  serverState: ServerState,
  uri: string,
  allowTracked = false
) {
  return serverState.telemetry.trackTiming<boolean>(
    "worker preprocessing cache invalidate",
    async () => {
      serverState.logger.trace(
        `Invalidating worker preprocessing cache: ${uri}`
      );

      const entry = serverState.solFileIndex[uri];

      if (entry === undefined) {
        return { status: "failed_precondition", result: false };
      }

      if (!allowTracked && entry.tracking === ClientTrackingState.TRACKED) {
        return { status: "ok", result: false };
      }

      const project = entry.project;

      if (project.type !== "hardhat") {
        return { status: "ok", result: false };
      }

      const workerProcess: WorkerProcess | undefined =
        serverState.workerProcesses[project.basePath];

      if (workerProcess === undefined) {
        return { status: "failed_precondition", result: false };
      }

      const result: boolean =
        await workerProcess.invalidatePreprocessingCache();

      return { status: "ok", result };
    }
  );
}
