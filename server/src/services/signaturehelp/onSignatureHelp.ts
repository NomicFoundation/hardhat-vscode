import { ServerState } from "../../types";
import { SignatureHelpParams, SignatureHelp } from "vscode-languageserver/node";
import { getUriFromDocument } from "../../utils/index";

export const onSignatureHelp = (serverState: ServerState) => {
  return (params: SignatureHelpParams): SignatureHelp | undefined => {
    const { logger } = serverState;

    logger.trace("onSignatureHelp");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (!document) {
        return;
      }

      const documentURI = getUriFromDocument(document);

      if (params.context?.triggerCharacter === "(") {
        serverState.languageServer.analyzer.analyzeDocument(
          document.getText(),
          documentURI
        );
      }

      const documentAnalyzer =
        serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

      if (!documentAnalyzer.isAnalyzed) {
        return;
      }

      return serverState.telemetry.trackTimingSync("onSignatureHelp", () =>
        serverState.languageServer.soliditySignatureHelp.doSignatureHelp(
          document,
          params.position,
          documentAnalyzer
        )
      );
    } catch (err) {
      logger.error(err);
    }
  };
};
