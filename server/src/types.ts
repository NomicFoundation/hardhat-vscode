import type { Connection } from "vscode-languageserver";
import type { TextDocuments } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { Logger } from "@utils/Logger";
import type { WorkspaceFolder } from "vscode-languageserver-protocol";
import type { SolFileIndexMap, SolProjectMap } from "@common/types";
import type { Telemetry } from "./telemetry/types";
import { BuildInputError } from "./frameworks/base/Errors";
import { WorkspaceFileRetriever } from "./utils/WorkspaceFileRetriever";

export interface ServerState {
  env: "production" | "development";
  hasWorkspaceFolderCapability: boolean;

  globalTelemetryEnabled: boolean;
  hardhatTelemetryEnabled: boolean;

  connection: Connection;
  documents: TextDocuments<TextDocument>;
  indexedWorkspaceFolders: WorkspaceFolder[];
  workspaceFoldersToIndex: WorkspaceFolder[];
  projects: SolProjectMap;
  solFileIndex: SolFileIndexMap;

  telemetry: Telemetry;
  logger: Logger;
  solcVersions: string[];
  indexingFinished: boolean;

  // Associate validation request ids to files to solve parallel validation jobs on the same file
  validationCount: number;
  lastValidationId: { [uri: string]: number };
  workspaceFileRetriever: WorkspaceFileRetriever;
}

export interface SolcError {
  component: "general";
  errorCode: string;
  formattedMessage: string;
  message: string;
  severity: "error" | "warning";
  sourceLocation?: { file: string; start: number; end: number };
  type: "DeclarationError";
}

/**
 * Framework provider wasn't able to build input
 */
export interface BuildInputFailed {
  status: "BUILD_INPUT_ERROR";
  error: BuildInputError;
}

/**
 * An error in completing the validation job
 * e.g. prerequisutes of compile failed, downloading
 * the solc compiler etc.
 */
export interface JobCompletionError {
  status: "JOB_COMPLETION_ERROR";
  projectBasePath: string;
  reason: string;
}

/**
 * The validation job ran and solc returned warnings/errors
 */
export interface ValidationFail {
  status: "VALIDATION_FAIL";
  projectBasePath: string;
  version: string;
  errors: SolcError[];
}

/**
 * The validation job ran and solc return no warnings/errors
 * indicating the code would compile.
 */
export interface ValidationPass {
  status: "VALIDATION_PASS";
  projectBasePath: string;
  version: string;
  sources: string[];
}

export type ValidationResult =
  | ValidationPass
  | ValidationFail
  | JobCompletionError
  | BuildInputFailed;

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

export type OpenDocuments = Array<{ uri: string; documentText: string }>;
