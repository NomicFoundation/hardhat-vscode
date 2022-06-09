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
    logCompletionMessage(workerState, buildJob, "Fail");

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
    logCompletionMessage(workerState, buildJob, "Pass");

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

function logCompletionMessage(
  workerState: WorkerState,
  buildJob: BuildJob,
  passOrFail: "Pass" | "Fail"
) {
  const finalSection =
    buildJob.preprocessingFinished === undefined
      ? ""
      : `, prep: ${timeSinceInSecs(
          buildJob.startTime,
          buildJob.preprocessingFinished
        )}, solc: ${timeSinceInSecs(buildJob.preprocessingFinished)}`;

  workerState.logger.trace(
    `[WORKER:${buildJob.jobId}] Validation complete - ${passOrFail} ${
      buildJob.fromInputCache ? "[Cached]" : ""
    } (total: ${timeSinceInSecs(buildJob.added)}, queued: ${timeSinceInSecs(
      buildJob.added,
      buildJob.startTime
    )}${finalSection})`
  );
}

function timeSinceInSecs(startTime: Date, endTime: Date = new Date()) {
  return (endTime.getTime() - startTime.getTime()) / 1000;
}
