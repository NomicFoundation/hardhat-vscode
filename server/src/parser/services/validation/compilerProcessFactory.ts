import { CompilerProcess, HardhatProcess } from "./HardhatProcess";

export function compilerProcessFactory(
  rootPath: string,
  uri: string
): CompilerProcess {
  return new HardhatProcess(rootPath, uri);
}
