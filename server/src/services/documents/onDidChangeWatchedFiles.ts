import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { DidChangeWatchedFilesParams } from "vscode-languageserver";
import { ServerState } from "../../types";
import { restartWorker } from "../validation/restartWorker";
import { invalidateWorkerPreprocessCache } from "../validation/invalidateWorkerPreprocessCache";

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
