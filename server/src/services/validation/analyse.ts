import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { decodeUriAndRemoveFilePrefix, isTestMode } from "../../utils/index";
import { ServerState } from "../../types";
import { addFrameworkTag } from "../../telemetry/tags";
import { indexSolidityFile } from "../initialization/indexWorkspaceFolders";
import { toPath } from "../../utils/paths";

export async function analyse(
  serverState: ServerState,
  { document }: TextDocumentChangeEvent<TextDocument>
) {
  serverState.logger.trace("analyse");

  return serverState.telemetry.trackTiming("analysis", async (transaction) => {
    try {
      const internalUri = decodeUriAndRemoveFilePrefix(document.uri);

      const solFileEntry =
        serverState.solFileIndex[internalUri] ??
        (await indexSolidityFile(serverState, internalUri));

      const absolutePath = toPath(document.uri);

      if (solFileEntry === undefined) {
        serverState.logger.error(
          new Error(`Could not analyze, uri is not indexed: ${internalUri}`)
        );

        return { status: "failed_precondition", result: false };
      }
      await solFileEntry.project.preAnalyze(absolutePath, document.getText());

      await analyzeSolFile(serverState, solFileEntry, document.getText());

      // Notify that a file was successfully
      if (isTestMode()) {
        await serverState.connection.sendNotification("custom/analyzed", {
          uri: document.uri,
        });
      }

      addFrameworkTag(transaction, solFileEntry.project);
      return { status: "ok", result: true };
    } catch (err) {
      serverState.logger.error(err);
      return { status: "internal_error", result: false };
    }
  });
}
