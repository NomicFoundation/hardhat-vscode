import { CodeActionParams, CodeAction } from "vscode-languageserver/node";
import { QuickFixResolver } from "./QuickFixResolver";
import { ServerState } from "../../types";

export function onCodeAction(serverState: ServerState) {
  return (params: CodeActionParams): CodeAction[] => {
    const { documents, analyzer, logger } = serverState;

    logger.trace("onCodeAction");

    try {
      return serverState.telemetry.trackTimingSync("onCodeAction", () => {
        const document = documents.get(params.textDocument.uri);

        if (!document || params.context.diagnostics.length === 0) {
          return [];
        }

        const quickFixResolver = new QuickFixResolver(
          analyzer,
          serverState.logger
        );

        return quickFixResolver.resolve(
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
