import { CodeActionParams, CodeAction } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { resolveQuickFixes } from "./QuickFixResolver";

export function onCodeAction(serverState: ServerState) {
  return (params: CodeActionParams): CodeAction[] => {
    const { documents, logger } = serverState;

    logger.trace("onCodeAction");

    return (
      serverState.telemetry.trackTimingSync("onCodeAction", () => {
        const document = documents.get(params.textDocument.uri);

        if (!document || params.context.diagnostics.length === 0) {
          return { status: "failed_precondition", result: [] };
        }

        const quickfixes = resolveQuickFixes(
          serverState,
          params.textDocument.uri,
          document,
          params.context.diagnostics
        );

        return { status: "ok", result: quickfixes };
      }) ?? []
    );
  };
}
