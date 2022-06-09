import { ServerState, WorkerProcess } from "../../types";

export async function restartWorker(serverState: ServerState, uri: string) {
  return serverState.telemetry.trackTiming("worker restart", async () => {
    serverState.logger.trace(`Restarting worker: ${uri}`);

    const project = Object.values(serverState.projects).find(
      (p) => p.configPath === uri
    );

    if (project === undefined) {
      serverState.logger.error(
        `No project found for changed config file: ${uri}`
      );

      return { status: "failed_precondition", result: false };
    }

    const workerProcess: WorkerProcess | undefined =
      serverState.workerProcesses[project.basePath];

    if (workerProcess === undefined) {
      serverState.logger.error(
        new Error(
          `No worker process for changed config file: ${project.basePath}`
        )
      );

      return { status: "failed_precondition", result: false };
    }

    await workerProcess.restart();

    return { status: "ok", result: true };
  });
}
