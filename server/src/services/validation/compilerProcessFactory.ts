import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import { CancelResolver, CompilerProcess } from "../../types";
import { HardhatProcess } from "./HardhatProcess";

export function compilerProcessFactory(
  project: HardhatProject,
  uri: string,
  cancelResolver: CancelResolver,
  logger: Logger
): CompilerProcess {
  return new HardhatProcess(project, uri, cancelResolver, logger);
}
