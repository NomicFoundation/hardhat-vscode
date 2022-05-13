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
  }) => Promise<{ errors: HardhatCompilerError[] }>;
  kill: () => void;
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
