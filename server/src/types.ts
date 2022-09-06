import type { Connection } from "vscode-languageserver";
import type { Serializable } from "child_process";
import type { TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { Logger } from "@utils/Logger";
import type { WorkspaceFolder } from "vscode-languageserver-protocol";
import type { SolFileIndexMap, SolProjectMap, Diagnostic } from "@common/types";
import type { HardhatProject } from "@analyzer/HardhatProject";
import type { HardhatRuntimeEnvironment, SolcBuild } from "hardhat/types";
import type { AnalysisResult } from "@nomicfoundation/solidity-analyzer";
import type { SolcInput } from "@services/validation/worker/build/buildInputsToSolc";
import type { Telemetry } from "./telemetry/types";

export type CancelResolver = (diagnostics: {
  [key: string]: Diagnostic[];
}) => void;

export interface CompilerProcess {
  init: (document: TextDocument) => {
    hardhatConfigFileExistPromise: Promise<unknown>;
    compilerDownloadedPromise: Promise<unknown>;
    solidityCompilePromise: Promise<unknown>;
  };

  send: (message: Serializable) => void;
  kill: () => void;
}

export type CompilerProcessFactory = (
  project: HardhatProject,
  logger: Logger,
  connection: Connection
) => WorkerProcess;

export interface WorkerProcess {
  project: HardhatProject;
  init: () => void;
  validate: (details: {
    uri: string;
    documentText: string;
    projectBasePath: string;
    openDocuments: Array<{
      uri: string;
      documentText: string;
    }>;
  }) => Promise<ValidationCompleteMessage>;
  invalidatePreprocessingCache: () => Promise<boolean>;
  kill: () => void;
  restart: () => Promise<void>;
}

export interface WorkerProcesses {
  [key: string]: WorkerProcess;
}

export interface ServerState {
  env: "production" | "development";
  hasWorkspaceFolderCapability: boolean;

  globalTelemetryEnabled: boolean;
  hardhatTelemetryEnabled: boolean;
  indexJobCount: number;

  compProcessFactory: CompilerProcessFactory;

  connection: Connection;
  documents: TextDocuments<TextDocument>;
  workspaceFolders: WorkspaceFolder[];
  projects: SolProjectMap;
  solFileIndex: SolFileIndexMap;
  workerProcesses: WorkerProcesses;

  telemetry: Telemetry;
  logger: Logger;
}

export interface WorkerLogger {
  log: (text: string) => void;
  error: (text: string) => void;
  trace: (text: string) => void;
}

export interface BuildContext {
  sourcePaths?: string[];
  sourceNames?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  solidityFilesCache?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencyGraph?: any;
  file?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compilationJob?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  solcBuild?: any;
}

export interface BuildJob extends BuildDetails {
  status: "processing" | "cancelled";
  context: BuildContext;
  startTime: Date;
  preprocessingFinished?: Date;
  fromInputCache: boolean;
}

export interface BuildDetails {
  uri: string;
  jobId: number;
  projectBasePath: string;
  documentText: string;
  openDocuments: Array<{
    uri: string;
    documentText: string;
  }>;
  added: Date;
}

export interface WorkerState {
  current: null | BuildJob;
  buildQueue: string[];
  buildJobs: { [key: string]: BuildDetails };
  compilerMetadataCache: { [key: string]: Promise<SolcBuild> };
  previousChangedDocAnalysis?: { uri: string; analysis: AnalysisResult };
  previousSolcInput?: SolcInput;

  hre: HardhatRuntimeEnvironment;
  originalReadFileAction: (
    args: { absolutePath: string },
    hre: HardhatRuntimeEnvironment,
    runSuper: () => {}
  ) => Promise<string>;
  solidityFilesCachePath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SolidityFilesCache: any;
  tasks: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_RUN_SOLCJS: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_RUN_SOLC: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TASK_COMPILE_SOLIDITY_READ_FILE: string;
  };
  send: (
    message: InitialisationCompleteMessage | ValidationCompleteMessage
  ) => Promise<void>;
  logger: WorkerLogger;
}

export interface HardhatImportFileError extends HardhatError {
  messageArguments: {
    imported: string;
  };
}

export interface HardhatImportLibraryError extends HardhatError {
  messageArguments: {
    library: string;
  };
}

export interface HardhatSourceImportError extends HardhatError {
  messageArguments: {
    imported: string;
    from: string;
  };
}

export interface HardhatError {
  name: "HardhatError";
  errorDescriptor: {
    number: number;
    message: string;
    title: string;
    description: string;
    shouldBeReported: boolean;
  };
  messageArguments?: unknown;
}

export interface ValidateCommand {
  type: "VALIDATE";
  jobId: number;
  uri: string;
  documentText: string;
  projectBasePath: string;
  openDocuments: Array<{
    uri: string;
    documentText: string;
  }>;
}

export interface InvalidatePreprocessingCacheMessage {
  type: "INVALIDATE_PREPROCESSING_CACHE";
}

export type HardhatWorkerCommand =
  | ValidateCommand
  | InvalidatePreprocessingCacheMessage;

export interface HardhatCompilerError {
  component: "general";
  errorCode: string;
  formattedMessage: string;
  message: string;
  severity: "error" | "warning";
  sourceLocation?: { file: string; start: number; end: number };
  type: "DeclarationError";
}

/**
 * While running the validation job, an error was thrown
 * from within hardhat.
 */
export interface HardhatThrownError {
  type: "VALIDATION_COMPLETE";
  status: "HARDHAT_ERROR";
  jobId: number;
  projectBasePath: string;
  hardhatError: HardhatError;
}

/**
 * An error with the background validation thread
 * e.g. failed to start or has died.
 */
export interface ValidatorError {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATOR_ERROR";
  jobId: number;
  projectBasePath: string;
  reason: string;
}

/**
 * An error in completing the validation job
 * e.g. prerequisutes of compile failed, downloading
 * the solc compiler etc.
 */
export interface JobCompletionError {
  type: "VALIDATION_COMPLETE";
  status: "JOB_COMPLETION_ERROR";
  jobId: number;
  projectBasePath: string;
  reason: string;
}

export interface UnknownError {
  type: "VALIDATION_COMPLETE";
  status: "UNKNOWN_ERROR";
  jobId: number;
  projectBasePath: string;
  error: unknown;
}

/**
 * The validation job ran and solc returned warnings/errors
 */
export interface ValidationFail {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_FAIL";
  jobId: number;
  projectBasePath: string;
  version: string;
  errors: HardhatCompilerError[];
}

/**
 * The validation job ran and solc return no warnings/errors
 * indicating the code would compile.
 */
export interface ValidationPass {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_PASS";
  jobId: number;
  projectBasePath: string;
  version: string;
  sources: string[];
}

/**
 * The validation job was cancelled part way through,
 * probably because a new edit came in.
 */
export interface CancelledValidation {
  type: "VALIDATION_COMPLETE";
  status: "CANCELLED";
  jobId: number;
  projectBasePath: string;
}

export interface InitialisationCompleteMessage {
  type: "INITIALISATION_COMPLETE";
}

export type ValidationCompleteMessage =
  | ValidationPass
  | ValidationFail
  | HardhatThrownError
  | JobCompletionError
  | ValidatorError
  | CancelledValidation
  | UnknownError;

export interface ValidationJobSuccessNotification {
  validationRun: true;
  projectBasePath: string;
  version: string;
}

export interface ValidationJobFailureNotification {
  validationRun: false;
  projectBasePath: string;
  reason: string;
  displayText: string;
  errorFile?: string;
}

export type ValidationJobStatusNotification =
  | ValidationJobFailureNotification
  | ValidationJobSuccessNotification;
