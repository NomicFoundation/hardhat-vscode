import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { DidChangeWatchedFilesParams } from "vscode-languageserver";
import { ServerState } from "../../types";

export function onDidChangeWatchedFiles(serverState: ServerState) {
  return ({ changes }: DidChangeWatchedFilesParams) => {
    for (const change of changes) {
      const internalUri = decodeUriAndRemoveFilePrefix(change.uri);

      restartWorker(serverState, internalUri).catch((err) => {
        serverState.logger.error(err);
      });
    }
  };
}

async function restartWorker(serverState: ServerState, uri: string) {
  return serverState.telemetry.trackTiming<boolean>(
    "worker restart",
    async () => {
      serverState.logger.trace(`Restarting worker: ${uri}`);

      const project = Object.values(serverState.projects).find(
        (p) => p.configPath === uri
      );

      if (project === undefined) {
        serverState.logger.error(
          `No project found for changed config file: ${uri}`
        );

        return { status: "failed_precondition", result: null };
      }

      const worker = serverState.workerProcesses[project.basePath];

      await worker.restart();

      return { status: "ok", result: null };
    }
  );
}
