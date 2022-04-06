import { CodeActionParams, CodeAction } from "vscode-languageserver/node";
import { QuickFixResolver } from "./QuickFixResolver";
import { ServerState } from "../../types";

export function onCodeAction(serverState: ServerState) {
  return (params: CodeActionParams): CodeAction[] => {
    const { documents, analyzer, logger } = serverState;

    logger.trace("onCodeAction");

    try {
      if (!analyzer) {
        return [];
      }

      const quickFixResolver = new QuickFixResolver(
        analyzer,
        serverState.logger
      );

      const document = documents.get(params.textDocument.uri);

      if (!document || params.context.diagnostics.length === 0) {
        return [];
      }

      return serverState.telemetry.trackTimingSync("onCodeAction", () =>
        quickFixResolver.resolve(
          params.textDocument.uri,
          document,
          params.context.diagnostics
        )
      );
    } catch (err) {
      logger.error(err);

      return [];
    }
  };
}
