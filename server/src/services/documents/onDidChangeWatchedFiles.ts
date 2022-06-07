import { ClientTrackingState } from "@common/types";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { DidChangeWatchedFilesParams } from "vscode-languageserver";
import { ServerState, WorkerProcess } from "../../types";

export function onDidChangeWatchedFiles(serverState: ServerState) {
  return async ({
    changes,
  }: DidChangeWatchedFilesParams): Promise<boolean[]> => {
    const results = [];

    for (const change of changes) {
      const internalUri = decodeUriAndRemoveFilePrefix(change.uri);

      if (internalUri.endsWith(".sol")) {
        const result = await invalidateWorkerPreprocessCache(
          serverState,
          internalUri
        );

        results.push(result ?? false);
      } else if (
        internalUri.endsWith("hardhat.config.ts") ||
        internalUri.endsWith("hardhat.config.js")
      ) {
        const result = await restartWorker(serverState, internalUri);

        results.push(result ?? false);
      }
    }

    return results;
  };
}

async function invalidateWorkerPreprocessCache(
  serverState: ServerState,
  uri: string
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

      if (entry.tracking === ClientTrackingState.TRACKED) {
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

async function restartWorker(serverState: ServerState, uri: string) {
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
