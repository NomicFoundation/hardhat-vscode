/* istanbul ignore file: top level dependency injection */
/* eslint-disable no-console */
import type { WorkerLogger } from "../../../types";

export function setupWorkerLogger(): WorkerLogger {
  return {
    log: console.log,
    error: console.error,
    trace: console.log,
  };
}
