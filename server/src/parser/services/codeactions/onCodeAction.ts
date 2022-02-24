import { Connection } from "vscode-languageserver";
import {
  CodeActionParams,
  TextDocuments,
  CodeAction,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { QuickFixResolver } from "./QuickFixResolver";
import { LanguageService } from "parser";
import { Logger } from "@utils/Logger";

export function onCodeAction(serverState: {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  languageServer: LanguageService | null;
  logger: Logger;
}) {
  return (params: CodeActionParams): CodeAction[] => {
    const { documents, languageServer, logger } = serverState;

    logger.trace("onCodeAction");

    try {
      if (!languageServer) {
        return [];
      }

      const quickFixResolver = new QuickFixResolver(
        languageServer,
        serverState.logger
      );

      const document = documents.get(params.textDocument.uri);

      if (!document || params.context.diagnostics.length === 0) {
        return [];
      }

      return quickFixResolver.resolve(
        params.textDocument.uri,
        document,
        params.context.diagnostics
      );
    } catch (err) {
      logger.error(err);

      return [];
    }
  };
}
