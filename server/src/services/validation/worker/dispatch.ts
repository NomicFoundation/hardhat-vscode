import type {
  HardhatError,
  HardhatWorkerCommand,
  ValidateCommand,
  ValidationCompleteMessage,
  WorkerState,
} from "../../../types";

export const VALIDATION_COMPLETE = "VALIDATION_COMPLETE";

export function dispatch(workerState: WorkerState) {
  return async (command: HardhatWorkerCommand) => {
    try {
      switch (command.type) {
        case "VALIDATE":
          return await validate(workerState, command);
        case "EXIT":
          return exitWorker(workerState);
        default:
          return assertNeverCommand(workerState, command);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        workerState.logger.error(err.message);
        return;
      }

      workerState.logger.error(JSON.stringify(err));
    }
  };
}

async function validate(workerState: WorkerState, command: ValidateCommand) {
  workerState.logger.log(`[WORKER] Running validate: ${command.uri}`);

  if (workerState.current) {
    return appendToQueue(workerState, command);
  }

  return runJob(workerState, command);
}

function appendToQueue(workerState: WorkerState, command: ValidateCommand) {
  workerState.buildJobs[command.uri] = {
    uri: command.uri,
    added: new Date(),
  };

  workerState.buildQueue.push(command.uri);
}

async function runJob(workerState: WorkerState, command: ValidateCommand) {
  delete workerState.buildJobs[command.uri];
  workerState.current = { uri: command.uri, status: "processing" };

  const buildResult = await hardhatBuild(workerState, command);

  workerState.current = null;

  await workerState.send(workerState, buildResult);
}

async function hardhatBuild(
  {
    hre,
    tasks: {
      TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
      TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
      TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
      TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
      TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
      TASK_COMPILE_SOLIDITY_COMPILE,
    },
    solidityFilesCachePath,
    SolidityFilesCache,
    logger,
  }: WorkerState,
  { uri, jobId, documentText, openDocuments }: ValidateCommand
): Promise<ValidationCompleteMessage> {
  const startTime = new Date();

  // Gets the paths to the contract files for the project
  const sourcePaths = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS);

  // transform them into relative paths to the project base path
  const sourceNames = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
    sourcePaths,
  });

  const filesCache = await SolidityFilesCache.readFromFile(
    solidityFilesCachePath
  );

  let dependencyGraph;
  try {
    dependencyGraph = await hre.run(
      TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
      {
        sourceNames,
        solidityFilesCache: filesCache,
      }
    );
  } catch (err: unknown) {
    // console.log("dependency graph", JSON.stringify(err, null, 2));
    return {
      type: VALIDATION_COMPLETE,
      status: "HARDHAT_ERROR",
      jobId,
      hardhatErrors: [convertToHardhatError(err)],
    };
  }

  const resolvedFile = dependencyGraph
    .getResolvedFiles()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((f: any) => f.absolutePath === uri)[0];

  let compilationJob;

  try {
    compilationJob = await hre.run(
      TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
      {
        file: resolvedFile,
        dependencyGraph,
        solidityFilesCache: filesCache,
      }
    );
  } catch (err) {
    // console.log("get compilation job", err);
    return {
      type: VALIDATION_COMPLETE,
      status: "HARDHAT_ERROR",
      jobId,
      hardhatErrors: [],
    };
  }

  if (compilationJob.reason) {
    logger.log(
      `[WORKER] Compilation job failed (${
        (new Date().getTime() - startTime.getTime()) / 1000
      }) - ${compilationJob.reason}`
    );

    return {
      type: VALIDATION_COMPLETE,
      status: "HARDHAT_ERROR",
      jobId,
      hardhatErrors: [],
    };
  }

  const modifiedFiles = {
    [uri]: documentText,
  };

  for (const unsavedDocument of openDocuments) {
    modifiedFiles[unsavedDocument.uri] = unsavedDocument.documentText;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compilationJob.getResolvedFiles().forEach((file: any) => {
    if (modifiedFiles[file.absolutePath]) {
      file.content.rawContent = modifiedFiles[file.absolutePath];
    }
  });

  const input = await hre.run(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, {
    compilationJob,
  });

  const solcVersion = compilationJob.getSolcConfig().version;

  const compileResult = await hre.run(TASK_COMPILE_SOLIDITY_COMPILE, {
    solcVersion,
    input,
    quiet: true,
    compilationJob,
    compilationJobs: [compilationJob],
    compilationJobIndex: 0,
  });

  const { output } = compileResult;

  if (output.errors?.length > 0) {
    logger.log(
      `[WORKER] Validation complete (${
        (new Date().getTime() - startTime.getTime()) / 1000
      }) - Fail`
    );

    return {
      type: VALIDATION_COMPLETE,
      status: "VALIDATION_FAIL",
      jobId,
      errors: output.errors,
    };
  } else {
    logger.log(
      `[WORKER] Validation complete (${
        (new Date().getTime() - startTime.getTime()) / 1000
      }) - Pass`
    );

    return {
      type: VALIDATION_COMPLETE,
      status: "VALIDATION_PASS",
      jobId,
      sources: switchForPaths(output.sources, sourcePaths),
    };
  }
}

function exitWorker({ logger }: WorkerState) {
  logger.log("Exiting thread");
  return process.exit();
}

function assertNeverCommand({ logger }: WorkerState, command: never) {
  logger.error(`[WORKER] Unknown Worker Command: ${JSON.stringify(command)}`);
}

function convertToHardhatError(err: unknown): HardhatError {
  if (!isHardhatError(err)) {
    return {
      name: "HardhatError",
      errorDescriptor: {
        number: 999,
        title: "Unconvertible hardhat error",
        description: "Hardat for VSCode could not convert the hardhat error",
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orignal = err as any;

  return {
    name: orignal.name,
    errorDescriptor: orignal.errorDescriptor,
    messageArguments: orignal.messageArguments,
  };
}

function isHardhatError(err: unknown): err is HardhatError {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err !== undefined && err !== null && (err as any)._isHardhatError === true
  );
}

function switchForPaths(
  sources: { [key: string]: unknown },
  paths: string[]
): string[] {
  return Object.keys(sources)
    .map((source) => paths.find((p) => p.endsWith(source)))
    .filter((p): p is string => p !== undefined);
}
