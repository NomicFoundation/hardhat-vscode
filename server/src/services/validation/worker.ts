/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path";

const VALIDATION_COMPLETE = "VALIDATION_COMPLETE";

interface BuildJob {
  status: "processing";
  uri: string;
}

interface BuildDetails {
  uri: string;
  added: Date;
}

interface HardhatRuntimeEnvironment {
  // eslint-disable-next-line @typescript-eslint/ban-types
  run: Function;
  config: {
    paths: string[];
  };
}

interface WorkerState {
  current: null | BuildJob;
  buildQueue: string[];
  buildJobs: { [key: string]: BuildDetails };
  hre: HardhatRuntimeEnvironment;
  getSolidityFilesCachePath: any;
  SolidityFilesCache: any;
  downloader: any;
  tasks: {
    TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS: any;
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES: any;
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH: any;
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE: any;
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT: any;
    TASK_COMPILE_SOLIDITY_COMPILE: any;
  };
}

interface ExitCommand {
  type: "EXIT";
}

interface ValidateCommand {
  type: "VALIDATE";
  jobId: number;
  uri: string;
  documentText: string;
  unsavedDocuments: Array<{
    uri: string;
    documentText: string;
  }>;
}

type HardhatWorkerCommand = ExitCommand | ValidateCommand;

interface HardhatError {
  component: "general";
  errorCode: number;
  formattedMessage: string;
  message: string;
  severity: "error" | "warning";
  sourceLocation?: { file: string; start: number; end: number };
  type: "DeclarationError";
}

interface ValidationCompleteMessage {
  type: "VALIDATION_COMPLETE";
  jobId: number;
  errors: HardhatError[];
}

const main = async () => {
  console.log("[WORKER] Starting Hardhat Worker");
  const workserState: WorkerState = await initialiseWorkerState();

  console.log("[WORKER] Waiting for messages ...");

  process.on("message", dispatch(workserState));
};

async function initialiseWorkerState(): Promise<WorkerState> {
  let hre;

  let hardhatBase = "";
  try {
    hardhatBase = path.resolve(
      require.resolve("hardhat", { paths: [process.cwd()] }),
      "..",
      "..",
      ".."
    );

    require(`${hardhatBase}/register.js`);

    hre = require(`${hardhatBase}/internal/lib/hardhat-lib.js`);
  } catch (err) {
    throw new Error("Unable to initialize Hardhat Runtime Environment");
  }

  const {
    TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
    TASK_COMPILE_SOLIDITY_COMPILE,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`${hardhatBase}/builtin-tasks/task-names`);

  const {
    getSolidityFilesCachePath,
    SolidityFilesCache,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`${hardhatBase}/builtin-tasks/utils/solidity-files-cache`);

  const {
    getCompilersDir,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`${hardhatBase}/internal/util/global-dir`);
  const {
    CompilerDownloader,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`${hardhatBase}/internal/solidity/compiler/downloader`);

  const compilersCache = await getCompilersDir();
  const downloader = new CompilerDownloader(compilersCache);

  return {
    current: null,
    buildQueue: [],
    buildJobs: {},
    hre,
    getSolidityFilesCachePath,
    SolidityFilesCache,
    downloader,
    tasks: {
      TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
      TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
      TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
      TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
      TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
      TASK_COMPILE_SOLIDITY_COMPILE,
    },
  };
}

function dispatch(workerState: WorkerState) {
  return (command: HardhatWorkerCommand) => {
    switch (command.type) {
      case "VALIDATE":
        return validate(workerState, command);
      case "EXIT":
        return exitWorker();
      default:
        return assertNeverCommand(command);
    }
  };
}

async function validate(workerState: WorkerState, command: ValidateCommand) {
  console.log("[WORKER] Running validate: ", command.uri);

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

  const errors = await hardhatBuild(workerState, command);

  workerState.current = null;

  await send({ type: VALIDATION_COMPLETE, jobId: command.jobId, errors });
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
    getSolidityFilesCachePath,
    SolidityFilesCache,
  }: WorkerState,
  { uri, documentText, unsavedDocuments }: ValidateCommand
): Promise<HardhatError[]> {
  const startTime = new Date();

  const sourcePaths = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS);

  const sourceNames = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
    sourcePaths,
  });

  const solidityFilesCachePath = getSolidityFilesCachePath(hre.config.paths);
  const filesCache = await SolidityFilesCache.readFromFile(
    solidityFilesCachePath
  );

  const dependencyGraph = await hre.run(
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
    {
      sourceNames,
      solidityFilesCache: filesCache,
    }
  );

  const resolvedFile = dependencyGraph
    .getResolvedFiles()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((f: any) => f.absolutePath === uri)[0];

  const compilationJob = await hre.run(
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
    {
      file: resolvedFile,
      dependencyGraph,
      solidityFilesCache: filesCache,
    }
  );

  if (compilationJob.reason) {
    console.log(
      `[WORKER] Compilation job failed (${
        (new Date().getTime() - startTime.getTime()) / 1000
      }) - ${compilationJob.reason}`
    );

    return [];
  }

  const modifiedFiles = {
    [uri]: documentText,
  };

  for (const unsavedDocument of unsavedDocuments) {
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

  console.log(
    `[WORKER] Validation complete (${
      (new Date().getTime() - startTime.getTime()) / 1000
    }) - ${output.errors ? "Fail" : "Pass"}`
  );

  return output.errors ?? [];
}

function send(message: ValidationCompleteMessage) {
  return new Promise<void>((resolve, reject) => {
    if (!process.send) {
      return;
    }

    process.send(message, (err: any) => {
      if (err) {
        return reject(err);
      }

      console.log("[WORKER] Job Complete");
      resolve();
    });
  });
}

function exitWorker() {
  return process.exit();
}

function assertNeverCommand(command: never) {
  console.error(`[WORKER] Unknown Worker Command: ${JSON.stringify(command)}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
