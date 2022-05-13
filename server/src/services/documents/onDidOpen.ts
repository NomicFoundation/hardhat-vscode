import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { ServerState } from "../../types";

export function onDidOpen(serverState: ServerState) {
  return (change: TextDocumentChangeEvent<TextDocument>) => {
    if (change.document.languageId !== "solidity") {
      return;
    }

    serverState.logger.trace("onDidOpen");

    const uri = decodeUriAndRemoveFilePrefix(change.document.uri);
    const solFileText = change.document.getText();

    const solFileEntry = getOrInitialiseSolFileEntry(serverState, uri);

    // Mark the file as being tracked by the client, but without
    // known changes from the file system version
    solFileEntry.track();

    // Ensure it is analysed
    analyzeSolFile(serverState, solFileEntry, solFileText);
  };
}
