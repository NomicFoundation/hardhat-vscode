import { CompletionList, CompletionParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { getUriFromDocument } from "../../utils/index";

export const onCompletion = (serverState: ServerState) => {
  return (params: CompletionParams): CompletionList | undefined => {
    const { logger } = serverState;

    logger.trace("onCompletion");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (document) {
        const documentText = document.getText();
        let newDocumentText = documentText;

        // Hack if triggerCharacter was "." then we insert ";" because the tolerance mode @solidity-parser/parser crashes as we type.
        // This only happens if there is no ";" at the end of the line.
        if (params.context?.triggerCharacter === ".") {
          const cursorOffset = document.offsetAt(params.position);
          const eofOffset =
            documentText.indexOf("\n", cursorOffset) > cursorOffset
              ? documentText.indexOf("\n", cursorOffset)
              : cursorOffset;
          newDocumentText =
            documentText.slice(0, cursorOffset) +
            "_;" +
            documentText.slice(cursorOffset, eofOffset) +
            ";";
        }

        const documentURI = getUriFromDocument(document);
        serverState.languageServer.analyzer.analyzeDocument(
          newDocumentText,
          documentURI
        );

        const documentAnalyzer =
          serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

        if (!documentAnalyzer) {
          return;
        }

        return serverState.telemetry.trackTimingSync("onCompletion", () =>
          serverState.languageServer.solidityCompletion.doComplete(
            params.position,
            documentAnalyzer,
            params.context,
            logger
          )
        );
      }
    } catch (err) {
      logger.error(err);
    }
  };
};
