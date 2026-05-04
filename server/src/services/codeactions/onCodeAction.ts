import { CodeActionParams, CodeAction } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { FAILED_PRECONDITION, OK } from "../../telemetry/TelemetryStatus";
import { resolveQuickFixes } from "./QuickFixResolver";

export function onCodeAction(serverState: ServerState) {
  return async (params: CodeActionParams): Promise<CodeAction[]> => {
    const { documents, logger } = serverState;

    logger.trace("onCodeAction");

    return (
      (await serverState.telemetry.trackTiming("onCodeAction", async () => {
        const document = documents.get(params.textDocument.uri);

        if (!document) {
          return { status: FAILED_PRECONDITION, result: [] as CodeAction[] };
        }

        const quickfixes = await resolveQuickFixes(
          serverState,
          params.textDocument.uri,
          document,
          params.context.diagnostics
        );

        return { status: OK, result: quickfixes };
      })) ?? []
    );
  };
}
