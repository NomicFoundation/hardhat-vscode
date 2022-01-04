import * as sinon from "sinon";
import { CompilerProcess } from "@services/validation/HardhatProcess";

export function setupMockCompilerProcessFactory(
  errors: {
    errorCode: string;
    severity: string;
    message: string;
    sourceLocation: {
      file: string;
      start: number;
      end: number;
    };
  }[] = []
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (rootPath: string, uri: string): CompilerProcess => {
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
