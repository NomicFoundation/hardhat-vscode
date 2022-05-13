import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getOrInitialiseSolFileEntry } from "@utils/getOrInitialiseSolFileEntry";
import { analyzeSolFile } from "@analyzer/analyzeSolFile";
import { decodeUriAndRemoveFilePrefix } from "../../utils/index";
import { ServerState } from "../../types";

export function analyse(
  { projects, solFileIndex, logger }: ServerState,
  { document: changeDoc }: TextDocumentChangeEvent<TextDocument>
) {
  logger.trace("analyse");

  try {
    const internalUri = decodeUriAndRemoveFilePrefix(changeDoc.uri);
    const solFileEntry = getOrInitialiseSolFileEntry(
      { projects, solFileIndex },
      internalUri
    );

    solFileEntry.track();
    analyzeSolFile({ solFileIndex }, solFileEntry, changeDoc.getText());
  } catch (err) {
    logger.error(err);
  }
}
