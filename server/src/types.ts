import { Connection } from "vscode-languageserver";
import * as childProcess from "child_process";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { SolFileIndexMap, SolProjectMap, Diagnostic } from "@common/types";
import { HardhatProject } from "@analyzer/HardhatProject";
import { Telemetry } from "./telemetry/types";

export type CancelResolver = (diagnostics: {
  [key: string]: Diagnostic[];
}) => void;

export interface CompilerProcess {
  init: (document: TextDocument) => {
    hardhatConfigFileExistPromise: Promise<unknown>;
    compilerDownloadedPromise: Promise<unknown>;
    solidityCompilePromise: Promise<unknown>;
  };

  send: (message: childProcess.Serializable) => void;
  kill: () => void;
}

export type CompilerProcessFactory = (
  project: HardhatProject,
  logger: Logger
) => WorkerProcess;

export interface HardhatCompilerError {
  component: "general";
  errorCode: string;
  formattedMessage: string;
  message: string;
  severity: "error" | "warning";
  sourceLocation?: { file: string; start: number; end: number };
  type: "DeclarationError";
}

export interface HardhatPreprocessingError {
  type: "VALIDATION_COMPLETE";
  status: "HARDHAT_ERROR";
  jobId: number;
  hardhatErrors: HardhatError[];
}

export interface ValidationFail {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_FAIL";
  jobId: number;
  errors: HardhatCompilerError[];
}

export interface ValidationPass {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_PASS";
  jobId: number;
  sources: string[];
}

export interface WorkerProcess {
  project: HardhatProject;
  init: () => void;
  validate: (details: {
    uri: string;
    documentText: string;
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
}

export interface BuildJob {
  status: "processing";
  uri: string;
}

export interface BuildDetails {
  uri: string;
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
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS: any;
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES: any;
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH: any;
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE: any;
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT: any;
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
    TASK_COMPILE_SOLIDITY_COMPILE: any;
  };
  send: (
    { logger }: WorkerState,
    message: ValidationCompleteMessage
  ) => Promise<void>;
  logger: WorkerLogger;
}

export interface ExitCommand {
  type: "EXIT";
}

export interface ValidateCommand {
  type: "VALIDATE";
  jobId: number;
  uri: string;
  documentText: string;
  openDocuments: Array<{
    uri: string;
    documentText: string;
  }>;
}

export type ImportLineErrorCode = 404 | 405 | 406 | 407 | 408 | 409;

export interface HardhatImportLineError {
  name: "HardhatError";
  errorDescriptor: {
    number: ImportLineErrorCode;
    title: string;
    description: string;
  };
  messageArguments: {
    imported: string;
  };
}

export interface UnknownHardhatError {
  name: "HardhatError";
  errorDescriptor: {
    number: number;
    title: string;
    description: string;
  };
}

export type HardhatError = UnknownHardhatError | HardhatImportLineError;

export type HardhatWorkerCommand = ExitCommand | ValidateCommand;

export interface HardhatCompilerError {
  component: "general";
  errorCode: string;
  formattedMessage: string;
  message: string;
  severity: "error" | "warning";
  sourceLocation?: { file: string; start: number; end: number };
  type: "DeclarationError";
}

export interface HardhatPreprocessingError {
  type: "VALIDATION_COMPLETE";
  status: "HARDHAT_ERROR";
  jobId: number;
  hardhatErrors: HardhatError[];
}

export interface ValidationFail {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_FAIL";
  jobId: number;
  errors: HardhatCompilerError[];
}

export interface ValidationPass {
  type: "VALIDATION_COMPLETE";
  status: "VALIDATION_PASS";
  jobId: number;
  sources: string[];
}

export type ValidationCompleteMessage =
  | ValidationPass
  | ValidationFail
  | HardhatPreprocessingError;
