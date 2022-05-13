import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { ServerState } from "../../types";

/**
 * Record in the index that the client has released the solidity file
 * from its responsibility (the version on disk should be taken as canonical).
 */
export function onDidClose(serverState: ServerState) {
  return (change: TextDocumentChangeEvent<TextDocument>) => {
    if (change.document.languageId !== "solidity") {
      return;
    }

    serverState.logger.trace("onDidClose");

    const uri = decodeUriAndRemoveFilePrefix(change.document.uri);
    const solFileEntry = getOrInitialiseSolFileEntry(serverState, uri);

    solFileEntry.untrack();
  };
}
