import * as Sentry from "@sentry/node";
import { Connection } from "vscode-languageserver";
import {
  CodeActionParams,
  TextDocuments,
  CodeAction,
  Diagnostic,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { constrainMutability } from "./actions/constrainMutability";

export function buildOnCodeAction(
  connection: Connection,
  documents: TextDocuments<TextDocument>
) {
  return (params: CodeActionParams): CodeAction[] => {
    connection.console.log("onCodeAction");

    try {
      const document = documents.get(params.textDocument.uri);

      if (!document || params.context.diagnostics.length === 0) {
        return [];
      }

      let actions: CodeAction[] = [];
      for (const diagnostic of params.context.diagnostics) {
        try {
          const diagnosticActions = resolveActionsFor(diagnostic, {
            document,
            uri: params.textDocument.uri,
          });

          actions = [...actions, ...diagnosticActions];
        } catch (err) {
          Sentry.captureException(err);
          connection.console.error(err as string);
        }
      }

      return actions;
    } catch (err) {
      Sentry.captureException(err);
      connection.console.error(err as string);

      return [];
    }
  };
}

function resolveActionsFor(
  diagnostic: Diagnostic,
  { document, uri }: { document: TextDocument; uri: string }
): CodeAction[] {
  switch (diagnostic.code) {
    case "2018":
      return constrainMutability(diagnostic, {
        document,
        uri,
      });
    default:
      return [];
  }
}
