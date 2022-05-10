import { CodeActionParams, CodeAction } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { resolveQuickFixes } from "./QuickFixResolver";

export function onCodeAction(serverState: ServerState) {
  return (params: CodeActionParams): CodeAction[] => {
    const { documents, logger } = serverState;

    logger.trace("onCodeAction");

    try {
      return serverState.telemetry.trackTimingSync("onCodeAction", () => {
        const document = documents.get(params.textDocument.uri);

        if (!document || params.context.diagnostics.length === 0) {
          return [];
        }

        return resolveQuickFixes(
          serverState,
          params.textDocument.uri,
          document,
          params.context.diagnostics
        );
      });
    } catch (err) {
      logger.error(err);

      return [];
    }
  };
}
