import type { ValidationCompleteMessage, WorkerState } from "../../types";
import { dispatch } from "./worker/dispatch";
import { initialiseWorkerState } from "./worker/initialiseWorkerState";
import { setupWorkerLogger } from "./worker/setupWorkerLogger";

const initialiseWorker = async () => {
  const workerLogger = setupWorkerLogger();

  workerLogger.log("[WORKER] Starting Hardhat Worker");
  const workserState = await initialiseWorkerState(send, workerLogger);

  workerLogger.log("[WORKER] Waiting for messages ...");

  process.on("message", dispatch(workserState));
};

function send(
  { logger }: WorkerState,
  message: ValidationCompleteMessage
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!process.send) {
      return;
    }

    process.send(message, (err: unknown) => {
      if (err) {
        return reject(err);
      }

      logger.log("[WORKER] Job Complete");
      resolve();
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
initialiseWorker();
