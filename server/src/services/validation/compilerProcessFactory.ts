/* istanbul ignore file: top level dependency injection */
import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import { Connection } from "vscode-languageserver";
import { WorkerProcess } from "../../types";
import { createProcessFor, HardhatWorker } from "./HardhatWorker";

export function compilerProcessFactory(
  project: HardhatProject,
  logger: Logger,
  connection: Connection
): WorkerProcess {
  return new HardhatWorker(project, createProcessFor, logger, connection);
}
