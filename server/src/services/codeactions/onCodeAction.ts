import { CodeActionParams, CodeAction } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { resolveQuickFixes } from "./QuickFixResolver";

export function onCodeAction(serverState: ServerState) {
  return async (params: CodeActionParams): Promise<CodeAction[]> => {
    const { documents, logger } = serverState;

    logger.trace("onCodeAction");

    return (
      (await serverState.telemetry.trackTiming("onCodeAction", async () => {
        const document = documents.get(params.textDocument.uri);

        if (!document) {
          return { status: "failed_precondition", result: [] };
        }

        const quickfixes = await resolveQuickFixes(
          serverState,
          params.textDocument.uri,
          document,
          params.context.diagnostics
        );

        return { status: "ok", result: quickfixes };
      })) ?? []
    );
  };
}
