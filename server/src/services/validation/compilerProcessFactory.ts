/* istanbul ignore file: top level dependency injection */
import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import { WorkerProcess } from "../../types";
import { HardhatWorker } from "./HardhatWorker";

export function compilerProcessFactory(
  project: HardhatProject,
  logger: Logger
): WorkerProcess {
  return new HardhatWorker(project, logger);
}
