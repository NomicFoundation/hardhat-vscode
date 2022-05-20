import {
  BuildJob,
  ValidationCompleteMessage,
  WorkerState,
} from "../../../../types";
import { buildInputsToSolc } from "./buildInputsToSolc";
import { convertErrorToMessage } from "./convertErrorToMessage";
import { solcCompile } from "./solcCompile";
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

export function switchForPaths(
  sources: { [key: string]: unknown },
  paths: string[] = []
): string[] {
  return Object.keys(sources)
    .map((source) => paths.find((p) => p.endsWith(source)))
    .filter((p): p is string => p !== undefined);
}
