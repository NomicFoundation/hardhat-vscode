import { CodeActionParams, CodeAction } from "vscode-languageserver/node";
import { QuickFixResolver } from "./QuickFixResolver";
import { ServerState } from "../../../types";

export function onCodeAction(serverState: ServerState) {
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

      return serverState.analytics.trackTiming("onCodeAction", () =>
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
