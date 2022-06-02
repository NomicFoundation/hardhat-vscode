import type { Connection } from "vscode-languageserver";
import type { Serializable } from "child_process";
import type { TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { Logger } from "@utils/Logger";
import type { WorkspaceFolder } from "vscode-languageserver-protocol";
import type { SolFileIndexMap, SolProjectMap, Diagnostic } from "@common/types";
import type { HardhatProject } from "@analyzer/HardhatProject";
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
  logger: Logger
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

export interface BuildJob {
  status: "processing" | "cancelled";
  context: BuildContext;
  startTime: Date;

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

export interface HardhatRuntimeEnvironment {
  // eslint-disable-next-line @typescript-eslint/ban-types
  run: Function;
  config: {
    paths: string[];
  };
}

export interface WorkerState {
  current: null | BuildJob;
  buildQueue: string[];
  buildJobs: { [key: string]: BuildDetails };
  hre: HardhatRuntimeEnvironment;
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
  };
  send: (message: ValidationCompleteMessage) => Promise<void>;
  logger: WorkerLogger;
}

export type ImportLineErrorCode = 404 | 405 | 406 | 407 | 408 | 409;

export interface HardhatImportLineError {
  name: "HardhatError";
  errorDescriptor: {
    number: number;
    message: string;
    title: string;
    description: string;
    shouldBeReported: boolean;
  };
  messageArguments: {
    imported: string;
  };
}

export interface UnknownHardhatError {
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

export type HardhatError = UnknownHardhatError | HardhatImportLineError;

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

export type HardhatWorkerCommand = ValidateCommand;

export interface HardhatCompilerError {
  component: "general";
  errorCode: string;
  formattedMessage: string;
  message: string;
  severity: "error" | "warning";
  sourceLocation?: { file: string; start: number; end: number };
  type: "DeclarationError";
}

export interface HardhatThrownError {
  type: "VALIDATION_COMPLETE";
  status: "HARDHAT_ERROR";
  jobId: number;
  projectBasePath: string;
  hardhatError: HardhatError;
}

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

export interface ValidationFail {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_FAIL";
  jobId: number;
  projectBasePath: string;
  version: string;
  errors: HardhatCompilerError[];
}

export interface ValidationPass {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_PASS";
  jobId: number;
  projectBasePath: string;
  version: string;
  sources: string[];
}

export interface CancelledValidation {
  type: "VALIDATION_COMPLETE";
  status: "CANCELLED";
  jobId: number;
  projectBasePath: string;
}

export type ValidationCompleteMessage =
  | ValidationPass
  | ValidationFail
  | HardhatThrownError
  | JobCompletionError
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
}

export type ValidationJobStatusNotification =
  | ValidationJobFailureNotification
  | ValidationJobSuccessNotification;
