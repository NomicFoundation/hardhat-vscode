import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { ServerState } from "../../types";

export function onDidOpen(serverState: ServerState) {
  return async (change: TextDocumentChangeEvent<TextDocument>) => {
    if (change.document.languageId !== "solidity") {
      return;
    }

    serverState.logger.trace("onDidOpen");

    const uri = decodeUriAndRemoveFilePrefix(change.document.uri);
    const solFileText = change.document.getText();

    const solFileEntry = getOrInitialiseSolFileEntry(serverState, uri);

    // Ensure it is analysed
    await analyzeSolFile(serverState, solFileEntry, solFileText);
  };
}
