import { Connection } from "vscode-languageserver";
import { TextDocuments } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Telemetry } from "telemetry/types";
import { Analytics } from "./analytics";
import { LanguageService } from "./parser";
import { Logger } from "@utils/Logger";

export type ServerState = {
  env: "production" | "development";
  rootUri: string | null;
  hasWorkspaceFolderCapability: boolean;
  telemetryEnabled: boolean;

  connection: Connection;
  documents: TextDocuments<TextDocument>;
  languageServer: LanguageService | null;
  analytics: Analytics | null;
  telemetry: Telemetry;
  logger: Logger;
};
