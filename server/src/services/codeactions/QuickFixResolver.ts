import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { compilerDiagnostics } from "@compilerDiagnostics/compilerDiagnostics";
import { ServerState } from "../../types";
import { decodeUriAndRemoveFilePrefix } from "../../utils";

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
  const codeActions: CodeAction[] = [];

  if (diagnostic.code !== undefined && diagnostic.code in compilerDiagnostics) {
    codeActions.push(
      ...compilerDiagnostics[diagnostic.code].resolveActions(
        serverState,
        diagnostic,
        {
          document,
          uri,
        }
      )
    );
  }

  const path = decodeUriAndRemoveFilePrefix(uri);
  const solFileEntry = serverState.solFileIndex[path];
  const project = solFileEntry?.project;

  if (project !== undefined) {
    codeActions.push(...project.resolveActionsFor(diagnostic, document, uri));
  }

  return codeActions;
}
