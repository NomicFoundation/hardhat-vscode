import {
  BuildJob,
  ValidationCompleteMessage,
  WorkerState,
} from "../../../../types";
import { clearPreprocessingCacheState } from "../utils/clearPreprocessingCacheState";
import { buildInputsToSolc } from "./buildInputsToSolc";
import { convertErrorToMessage } from "./convertErrorToMessage";
import { solcCompile, SolcResult } from "./solcCompile";
import { solcOutputToCompleteMessage } from "./solcOutputToCompleteMessage";

export async function hardhatBuild(
  workerState: WorkerState,
  buildJob: BuildJob
): Promise<ValidationCompleteMessage> {
  try {
    const solcInputs = await buildInputsToSolc(workerState, buildJob);

    if (!solcInputs.built) {
      return solcInputs.result;
    }

    const solcResult = await solcCompile(workerState, solcInputs);

    clearCacheOnImportLineError(workerState, solcResult);

    return solcOutputToCompleteMessage(
      workerState,
      buildJob,
      solcInputs,
      solcResult
    );
  } catch (err) {
    return convertErrorToMessage(err, buildJob);
  }
}

function clearCacheOnImportLineError(
  workerState: WorkerState,
  solcResult: SolcResult
) {
  if (
    solcResult.output.errors !== undefined &&
    solcResult.output.errors.some((error) =>
      ["6275", "7858"].includes(error.errorCode)
    )
  ) {
    clearPreprocessingCacheState(workerState);
  }
}

export function switchForPaths(
  sources: { [key: string]: unknown },
  paths: string[] = []
): string[] {
  return Object.keys(sources)
    .map((source) =>
      paths.find((p) => p.replaceAll("\\", "/").endsWith(source))
    )
    .filter((p): p is string => p !== undefined)
    .map((path) => path.replaceAll("\\", "/"));
}
