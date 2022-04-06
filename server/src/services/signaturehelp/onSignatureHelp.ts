import { ServerState } from "../../types";
import { SignatureHelpParams, SignatureHelp } from "vscode-languageserver/node";
import { getUriFromDocument } from "../../utils/index";
import { SoliditySignatureHelp } from "@services/documentation/SoliditySignatureHelp";

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
        serverState.analyzer.analyzeDocument(document.getText(), documentURI);
      }

      const documentAnalyzer =
        serverState.analyzer.getDocumentAnalyzer(documentURI);

      if (!documentAnalyzer.isAnalyzed) {
        return;
      }

      return serverState.telemetry.trackTimingSync("onSignatureHelp", () =>
        new SoliditySignatureHelp(serverState.analyzer).doSignatureHelp(
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
