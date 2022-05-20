import {
  BuildJob,
  CancelledValidation,
  ValidationCompleteMessage,
  ValidationFail,
  ValidationPass,
  WorkerState,
} from "../../../../types";
import { SolcInput } from "./buildInputsToSolc";
import { SolcResult } from "./solcCompile";
import { switchForPaths } from "./hardhatBuild";

export function solcOutputToCompleteMessage(
  workerState: WorkerState,
  buildJob: BuildJob,
  solcInputs: SolcInput,
  { output }: SolcResult
): ValidationCompleteMessage {
  if (buildJob.status === "cancelled") {
    const cancelledMessage: CancelledValidation = {
      type: "VALIDATION_COMPLETE",
      status: "CANCELLED",
      jobId: buildJob.jobId,
      projectBasePath: buildJob.projectBasePath,
    };

    return cancelledMessage;
  }

  if (output.errors?.length > 0) {
    workerState.logger.trace(
      `[WORKER] Validation complete (${timeSinceInSecs(
        buildJob.startTime
      )} processing, total: ${timeSinceInSecs(buildJob.added)}) - Fail`
    );

    const validationFailMessage: ValidationFail = {
      type: "VALIDATION_COMPLETE",
      status: "VALIDATION_FAIL",
      jobId: buildJob.jobId,
      projectBasePath: buildJob.projectBasePath,
      version: solcInputs.solcVersion,
      errors: output.errors,
    };

    return validationFailMessage;
  } else {
    workerState.logger.trace(
      `[WORKER] Validation complete (${timeSinceInSecs(
        buildJob.startTime
      )} processing, total: ${timeSinceInSecs(buildJob.added)}) - Pass`
    );

    const validationPassMessage: ValidationPass = {
      type: "VALIDATION_COMPLETE",
      status: "VALIDATION_PASS",
      jobId: buildJob.jobId,
      projectBasePath: buildJob.projectBasePath,
      version: solcInputs.solcVersion,
      sources: switchForPaths(output.sources, solcInputs.sourcePaths),
    };

    return validationPassMessage;
  }
}

function timeSinceInSecs(startTime: Date) {
  return (new Date().getTime() - startTime.getTime()) / 1000;
}
