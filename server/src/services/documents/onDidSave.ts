import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { ServerState } from "../../types";

export function onDidSave(serverState: ServerState) {
  return (change: TextDocumentChangeEvent<TextDocument>) => {
    if (change.document.languageId !== "solidity") {
      return;
    }

    serverState.logger.trace("onDidSave");

    const uri = decodeUriAndRemoveFilePrefix(change.document.uri);
    const solFileEntry = getOrInitialiseSolFileEntry(serverState, uri);

    solFileEntry.track();
  };
}
