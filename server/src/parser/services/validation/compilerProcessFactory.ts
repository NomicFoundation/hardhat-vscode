import { Logger } from "@utils/Logger";
import { CompilerProcess, HardhatProcess } from "./HardhatProcess";

export function compilerProcessFactory(
  rootPath: string,
  uri: string,
  logger: Logger
): CompilerProcess {
  return new HardhatProcess(rootPath, uri, logger);
}
