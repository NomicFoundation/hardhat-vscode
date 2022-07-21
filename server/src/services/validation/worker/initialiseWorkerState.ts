/* istanbul ignore file: top level node loading */
import path from "path";
import type {
  InitialisationCompleteMessage,
  ValidationCompleteMessage,
  WorkerLogger,
  WorkerState,
} from "../../../types";

export async function initialiseWorkerState(
  send: (
    message: InitialisationCompleteMessage | ValidationCompleteMessage
  ) => Promise<void>,
  logger: WorkerLogger
): Promise<WorkerState> {
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
    throw new Error(`Unable to initialize Hardhat Runtime Environment`);
  }

  const {
    TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
    TASK_COMPILE_SOLIDITY_RUN_SOLCJS,
    TASK_COMPILE_SOLIDITY_RUN_SOLC,
    TASK_COMPILE_SOLIDITY_READ_FILE,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`${hardhatBase}/builtin-tasks/task-names`);

  const {
    getSolidityFilesCachePath,
    SolidityFilesCache,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require(`${hardhatBase}/builtin-tasks/utils/solidity-files-cache`);

  const solidityFilesCachePath = getSolidityFilesCachePath(hre.config.paths);

  const originalReadFileAction =
    hre.tasks[TASK_COMPILE_SOLIDITY_READ_FILE].action;

  return {
    current: null,
    buildQueue: [],
    buildJobs: {},
    compilerMetadataCache: {},

    hre,
    originalReadFileAction,
    solidityFilesCachePath,
    SolidityFilesCache,
    tasks: {
      TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
      TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
      TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
      TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
      TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
      TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
      TASK_COMPILE_SOLIDITY_RUN_SOLCJS,
      TASK_COMPILE_SOLIDITY_RUN_SOLC,
      TASK_COMPILE_SOLIDITY_READ_FILE,
    },
    send,
    logger,
  };
}
