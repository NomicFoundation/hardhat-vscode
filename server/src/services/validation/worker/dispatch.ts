import type {
  BuildDetails,
  BuildJob,
  CancelledValidation,
  HardhatWorkerCommand,
  ValidateCommand,
  WorkerState,
} from "../../../types";
import { convertErrorToMessage } from "./build/convertErrorToMessage";
import { hardhatBuild } from "./build/hardhatBuild";

export function dispatch(workerState: WorkerState) {
  return async (command: HardhatWorkerCommand) => {
    try {
      return await validate(workerState, command);
    } catch (err: unknown) {
      /* istanbul ignore else */
      if (err instanceof Error) {
        workerState.logger.error(err.message);
      } else {
        workerState.logger.error(JSON.stringify(err));
      }

      try {
        const message = convertErrorToMessage(err, command);

        await workerState.send(message);
      } catch (innerErr: unknown) {
        // log and ignore
        /* istanbul ignore else */
        if (err instanceof Error) {
          workerState.logger.error(err.message);
        } else {
          workerState.logger.error(JSON.stringify(err));
        }
      }

      // clear the state
      workerState.current = null;
      workerState.buildQueue = [];
      workerState.buildJobs = {};
    }
  };
}

async function validate(workerState: WorkerState, command: ValidateCommand) {
  workerState.logger.trace(`[WORKER] Running validate: ${command.uri}`);

  await recordCommand(workerState, command);

  if (!workerState.buildQueue.includes(command.uri)) {
    workerState.buildQueue.push(command.uri);
  }

  if (workerState.current !== null) {
    if (workerState.current.uri === command.uri) {
      workerState.current.status = "cancelled";
    }

    return;
  }

  return runNextJob(workerState);
}

async function recordCommand(
  workerState: WorkerState,
  command: ValidateCommand
) {
  if (command.uri in workerState.buildJobs) {
    const previous = workerState.buildJobs[command.uri];

    const cancelledMessage: CancelledValidation = {
      type: "VALIDATION_COMPLETE",
      status: "CANCELLED",
      jobId: previous.jobId,
      projectBasePath: previous.projectBasePath,
    };

    await workerState.send(cancelledMessage);
  }

  workerState.buildJobs[command.uri] = {
    uri: command.uri,
    jobId: command.jobId,
    added: new Date(),
    projectBasePath: command.projectBasePath,
    documentText: command.documentText,
    openDocuments: command.openDocuments,
  };
}

async function runNextJob(workerState: WorkerState): Promise<void> {
  const uri = workerState.buildQueue.pop();

  if (uri === undefined) {
    if (Object.values(workerState.buildJobs).length > 0) {
      throw new Error("POST CONDITION NOT MET: build jobs not cleared");
    }

    workerState.current = null;

    return;
  }

  const lastDetails: BuildDetails | undefined = workerState.buildJobs[uri];
  delete workerState.buildJobs[uri];

  /* istanbul ignore if */
  if (lastDetails === undefined) {
    throw new Error(`No job details in build jobs for ${uri}`);
  }

  const buildJob: BuildJob = {
    status: "processing",
    startTime: new Date(),
    context: {},

    uri: lastDetails.uri,
    jobId: lastDetails.jobId,
    projectBasePath: lastDetails.projectBasePath,
    documentText: lastDetails.documentText,
    openDocuments: lastDetails.openDocuments,
    added: lastDetails.added,
  };

  workerState.current = buildJob;

  const buildResult = await hardhatBuild(workerState, buildJob);

  await workerState.send(buildResult);

  workerState.current = null;

  return runNextJob(workerState);
}
