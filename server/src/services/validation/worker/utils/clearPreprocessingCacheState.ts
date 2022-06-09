import { WorkerState } from "../../../../types";

export function clearPreprocessingCacheState(workerState: WorkerState) {
  workerState.previousSolcInput = undefined;
  workerState.previousChangedDocAnalysis = undefined;
}
