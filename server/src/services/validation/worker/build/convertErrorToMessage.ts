import { serializeError } from "serialize-error";
import { HardhatError, ValidationCompleteMessage } from "../../../../types";

export function convertErrorToMessage(
  err: unknown,
  { jobId, projectBasePath }: { jobId: number; projectBasePath: string }
): ValidationCompleteMessage {
  if (isHardhatPlatformError(err)) {
    return {
      type: "VALIDATION_COMPLETE",
      status: "HARDHAT_ERROR",
      jobId,
      projectBasePath,
      hardhatError: {
        name: "HardhatError",
        errorDescriptor: err.errorDescriptor,
        messageArguments: err.messageArguments,
      },
    };
  }

  return {
    type: "VALIDATION_COMPLETE",
    status: "UNKNOWN_ERROR",
    jobId,
    projectBasePath,
    error: serializeError(err),
  };
}

function isHardhatPlatformError(err: unknown): err is HardhatError {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err !== undefined && err !== null && (err as any)._isHardhatError === true
  );
}
