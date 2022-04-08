import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import { CompilerProcess } from "../../types";
import { HardhatProcess } from "./HardhatProcess";

export function compilerProcessFactory(
  project: HardhatProject,
  uri: string,
  logger: Logger
): CompilerProcess {
  return new HardhatProcess(project, uri, logger);
}
