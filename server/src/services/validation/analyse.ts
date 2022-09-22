import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import { ServerState } from "../../types";

export function analyse(
  serverState: ServerState,
  { document: changeDoc }: TextDocumentChangeEvent<TextDocument>
) {
  serverState.logger.trace("analyse");

  try {
    const internalUri = decodeUriAndRemoveFilePrefix(changeDoc.uri);
    const solFileEntry = getOrInitialiseSolFileEntry(serverState, internalUri);

    solFileEntry.track();
    analyzeSolFile(serverState, solFileEntry, changeDoc.getText());
  } catch (err) {
    serverState.logger.error(err);
  }
}
