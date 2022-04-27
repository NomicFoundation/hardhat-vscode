import { Connection } from "vscode-languageserver";
import * as childProcess from "child_process";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Telemetry } from "telemetry/types";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";
import { DocumentsAnalyzerMap, SolProjectMap } from "@common/types";
import { HardhatProject } from "@analyzer/HardhatProject";

export interface CompilerProcess {
  init: () => {
    hardhatConfigFileExistPromise: Promise<unknown>;
    compilerDownloadedPromise: Promise<unknown>;
    solidityCompilePromise: Promise<unknown>;
  };

  send: (message: childProcess.Serializable) => void;
  kill: () => void;
}

export type ServerState = {
  env: "production" | "development";
  hasWorkspaceFolderCapability: boolean;

  globalTelemetryEnabled: boolean;
  hardhatTelemetryEnabled: boolean;
  indexJobCount: number;

  compProcessFactory: (
    project: HardhatProject,
    uri: string,
    logger: Logger
  ) => CompilerProcess;

  connection: Connection;
  documents: TextDocuments<TextDocument>;
  workspaceFolders: WorkspaceFolder[];
  projects: SolProjectMap;
  solFileIndex: DocumentsAnalyzerMap;

  telemetry: Telemetry;
  logger: Logger;
};
