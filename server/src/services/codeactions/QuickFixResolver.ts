import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { compilerDiagnostics } from "@compilerDiagnostics/compilerDiagnostics";
import { ServerState } from "../../types";

export function resolveQuickFixes(
  serverState: ServerState,
  uri: string,
  document: TextDocument,
  diagnostics: Diagnostic[]
): CodeAction[] {
  let actions: CodeAction[] = [];

  for (const diagnostic of diagnostics) {
    try {
      const diagnosticActions = resolveActionsFor(serverState, diagnostic, {
        document,
        uri,
      });

      actions = [...actions, ...diagnosticActions];
    } catch (err) {
      serverState.logger.error(err);
    }
  }

  return actions;
}

function resolveActionsFor(
  serverState: ServerState,
  diagnostic: Diagnostic,
  { document, uri }: { document: TextDocument; uri: string }
): CodeAction[] {
  if (diagnostic.code !== undefined && diagnostic.code in compilerDiagnostics) {
    return compilerDiagnostics[diagnostic.code].resolveActions(
      serverState,
      diagnostic,
      {
        document,
        uri,
      }
    );
  } else {
    return [];
  }
}
