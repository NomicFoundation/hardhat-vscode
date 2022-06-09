import { HardhatProject } from "@analyzer/HardhatProject";
import * as sinon from "sinon";
import {
  CompilerProcessFactory,
  HardhatCompilerError,
  ValidationFail,
  WorkerProcess,
} from "../../src/types";

export function setupMockCompilerProcessFactory(
  errors: HardhatCompilerError[] = []
): CompilerProcessFactory {
  return (project: HardhatProject): WorkerProcess => {
    return {
      project,
      init: sinon.spy(),
      validate: sinon.spy(() => {
        const validationMessage: ValidationFail = {
          type: "VALIDATION_COMPLETE",
          status: "VALIDATION_FAIL",
          jobId: 1,
          projectBasePath: project.basePath,
          version: "9.9.9",
          errors,
        };

        return validationMessage;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
      invalidatePreprocessingCache: sinon.spy(() => {
        return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
      kill: sinon.spy(),
      restart: sinon.spy(),
    } as WorkerProcess;
  };
}
