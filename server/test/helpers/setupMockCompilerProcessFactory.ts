import { HardhatProject } from "@analyzer/HardhatProject";
import * as sinon from "sinon";
import { CompilerProcessFactory, WorkerProcess } from "../../src/types";

export function setupMockCompilerProcessFactory(
  errors: Array<{
    errorCode: string;
    severity: string;
    message: string;
    sourceLocation: {
      file: string;
      start: number;
      end: number;
    };
  }> = []
): CompilerProcessFactory {
  return (project: HardhatProject): WorkerProcess => {
    return {
      project,
      init: sinon.spy(),
      validate: sinon.spy(() => {
        return { errors };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
      kill: sinon.spy(),
      restart: sinon.spy(),
    } as WorkerProcess;
  };
}
