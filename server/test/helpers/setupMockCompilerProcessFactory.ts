import { HardhatProject } from "@analyzer/HardhatProject";
import * as sinon from "sinon";
import { CompilerProcess } from "../../src/types";

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
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (project: HardhatProject, uri: string): CompilerProcess => {
    return {
      init: sinon.fake(() => ({
        hardhatConfigFileExistPromise: Promise.resolve(true),
        compilerDownloadedPromise: Promise.resolve(true),
        solidityCompilePromise: Promise.resolve({
          errors,
        }),
      })),
      send: sinon.spy(),
      kill: sinon.spy(),
    } as CompilerProcess;
  };
}
