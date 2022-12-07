import { ServerState } from "../../types";
import { onDidChangeWatchedFiles } from "./onDidChangeWatchedFiles";
import { onDidChangeContent } from "./onDidChangeContent";

/**
 * Establish a sync between the client and the `serverState.documents`
 * collection. Track which solidity files in the index are being
 * tracked by the client. Propagate file changes to validation and
 * analysis.
 * @param serverState the combined state of the lsp
 */
export function attachDocumentHooks(serverState: ServerState) {
  // The content of a text document has changed. This event is emitted
  // when the text document first opened or when its content has changed.
  // This is the start of our validation pipeline
  serverState.documents.onDidChangeContent(onDidChangeContent(serverState));

  //
  serverState.connection.onDidChangeWatchedFiles(
    onDidChangeWatchedFiles(serverState)
  );

  // Make the text document manager listen on the connection
  // for open, change and close text document events
  serverState.documents.listen(serverState.connection);
}
