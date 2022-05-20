import {
  WorkerState,
  BuildJob,
  ValidationCompleteMessage,
} from "../../../../types";
export interface SolcInput {
  built: true;
  solcVersion: string;
  input: unknown;
  compilationJob: unknown;
  sourcePaths: string[];
}

export async function buildInputsToSolc(
  workerState: WorkerState,
  buildJob: BuildJob
): Promise<{ built: false; result: ValidationCompleteMessage } | SolcInput> {
  await getSourcePaths(workerState, buildJob);

  if (isJobCancelled(buildJob)) {
    return cancel(buildJob);
  }

  await getSourceNames(workerState, buildJob);

  if (isJobCancelled(buildJob)) {
    return cancel(buildJob);
  }

  await readFileCache(workerState, buildJob);

  if (isJobCancelled(buildJob)) {
    return cancel(buildJob);
  }

  await getDependencyGraph(workerState, buildJob);

  if (isJobCancelled(buildJob)) {
    return cancel(buildJob);
  }

  getValidationFile(workerState, buildJob);

  const result = await getCompilationJob(workerState, buildJob);

  if (result !== null) {
    return { built: false, result };
  }

  if (isJobCancelled(buildJob)) {
    return cancel(buildJob);
  }

  await getSolcInput(workerState, buildJob);

  if (isJobCancelled(buildJob)) {
    return cancel(buildJob);
  }

  const solcVersion = buildJob.context.compilationJob.getSolcConfig().version;

  return {
    built: true,
    solcVersion,
    input: buildJob.context.input,
    compilationJob: buildJob.context.compilationJob,
    sourcePaths: buildJob.context.sourcePaths ?? [],
  };
}

// Gets the paths to the contract files for the project
async function getSourcePaths(
  { hre, tasks: { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } }: WorkerState,
  { context }: BuildJob
) {
  context.sourcePaths = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS);
}

// transform them into relative paths to the project base path
async function getSourceNames(
  { hre, tasks: { TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES } }: WorkerState,
  { context }: BuildJob
) {
  context.sourceNames = await hre.run(
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    context
  );
}

async function readFileCache(
  { SolidityFilesCache, solidityFilesCachePath }: WorkerState,
  { context }: BuildJob
) {
  context.solidityFilesCache = await SolidityFilesCache.readFromFile(
    solidityFilesCachePath
  );
}

async function getDependencyGraph(
  { hre, tasks: { TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH } }: WorkerState,
  { context }: BuildJob
) {
  context.dependencyGraph = await hre.run(
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
    context
  );
}

function getValidationFile(
  _workerState: WorkerState,
  { uri, context }: BuildJob
): void {
  context.file = context.dependencyGraph
    .getResolvedFiles()
    .filter(
      (f: { absolutePath: string }) =>
        f.absolutePath.replaceAll("\\", "/") === uri
    )[0];
}

async function getCompilationJob(
  {
    hre,
    tasks: { TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE },
    logger,
  }: WorkerState,
  { jobId, projectBasePath, context, startTime }: BuildJob
): Promise<ValidationCompleteMessage | null> {
  context.compilationJob = await hre.run(
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
    {
      file: context.file,
      dependencyGraph: context.dependencyGraph,
      solidityFilesCache: context.solidityFilesCache,
    }
  );

  if (context.compilationJob.reason) {
    logger.trace(
      `[WORKER] Compilation job failed (${
        (new Date().getTime() - startTime.getTime()) / 1000
      }) - ${context.compilationJob.reason}`
    );

    return {
      type: "VALIDATION_COMPLETE",
      status: "JOB_COMPLETION_ERROR",
      jobId,
      projectBasePath,
      reason: context.compilationJob.reason,
    };
  }

  return null;
}

async function getSolcInput(
  { hre, tasks: { TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT } }: WorkerState,
  { uri, documentText, openDocuments, context }: BuildJob
): Promise<ValidationCompleteMessage | null> {
  const modifiedFiles = {
    [uri]: documentText,
  };

  for (const unsavedDocument of openDocuments) {
    modifiedFiles[unsavedDocument.uri] = unsavedDocument.documentText;
  }

  context.compilationJob
    .getResolvedFiles()
    .forEach(
      (file: { absolutePath: string; content: { rawContent: string } }) => {
        const normalizeAbsPath = file.absolutePath.replaceAll("\\", "/");

        if (modifiedFiles[normalizeAbsPath]) {
          file.content.rawContent = modifiedFiles[normalizeAbsPath];
        }
      }
    );

  context.input = await hre.run(
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
    context
  );

  return null;
}

function cancel({ jobId, projectBasePath }: BuildJob): {
  built: false;
  result: ValidationCompleteMessage;
} {
  return {
    built: false,
    result: {
      type: "VALIDATION_COMPLETE",
      status: "CANCELLED",
      jobId,
      projectBasePath,
    },
  };
}

function isJobCancelled(buildJob: BuildJob) {
  return buildJob.status === "cancelled";
}
