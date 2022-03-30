import * as events from "events";
import { Connection } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Telemetry } from "telemetry/types";
import { LanguageService } from "./parser";
import { Logger } from "@utils/Logger";
import { WorkspaceFolder } from "vscode-languageserver-protocol";

export type ServerState = {
  env: "production" | "development";
  hasWorkspaceFolderCapability: boolean;

  globalTelemetryEnabled: boolean;
  hardhatTelemetryEnabled: boolean;

  connection: Connection;
  documents: TextDocuments<TextDocument>;
  workspaceFolders: WorkspaceFolder[];
  em: events.EventEmitter;
  languageServer: LanguageService;
  telemetry: Telemetry;
  logger: Logger;
};
