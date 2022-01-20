import * as Sentry from "@sentry/node";
import { Connection } from "vscode-languageserver";
import {
  CodeActionParams,
  TextDocuments,
  CodeAction,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { QuickFixResolver } from "./QuickFixResolver";
import { LanguageService } from "parser";

export function onCodeAction(state: {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  languageServer: LanguageService | null;
}) {
  return (params: CodeActionParams): CodeAction[] => {
    const { connection, documents, languageServer } = state;

    connection.console.log("onCodeAction");

    try {
      if (!languageServer) {
        return [];
      }

      const quickFixResolver = new QuickFixResolver(
        languageServer,
        connection.console
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
      Sentry.captureException(err);
      connection.console.error(err as string);

      return [];
    }
  };
}
