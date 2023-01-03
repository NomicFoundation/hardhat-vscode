import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { decodeUriAndRemoveFilePrefix, isTestMode } from "../../utils/index";
import { ServerState } from "../../types";
import { addFrameworkTag } from "../../telemetry/tags";

export async function analyse(
  serverState: ServerState,
  { document: changeDoc }: TextDocumentChangeEvent<TextDocument>
) {
  serverState.logger.trace("analyse");

  return serverState.telemetry.trackTiming("analysis", async (transaction) => {
    try {
      const internalUri = decodeUriAndRemoveFilePrefix(changeDoc.uri);
      const solFileEntry = getOrInitialiseSolFileEntry(
        serverState,
        internalUri
      );

      await analyzeSolFile(serverState, solFileEntry, changeDoc.getText());

      // Notify that a file was successfully
      if (isTestMode()) {
        serverState.connection.sendNotification("custom/analyzed", {
          uri: changeDoc.uri,
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
