import * as events from "events";
import { Connection } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Telemetry } from "telemetry/types";
import { LanguageService } from "./parser";
import { Logger } from "@utils/Logger";

export type ServerState = {
  env: "production" | "development";
  rootUri: string;
  hasWorkspaceFolderCapability: boolean;
  globalTelemetryEnabled: boolean;
  hardhatTelemetryEnabled: boolean;

  connection: Connection;
  documents: TextDocuments<TextDocument>;
  em: events.EventEmitter;
  languageServer: LanguageService;
  telemetry: Telemetry;
  logger: Logger;
};
