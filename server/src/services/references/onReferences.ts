import { SolidityNavigation } from "@services/navigation/SolidityNavigation";
import { ReferenceParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { getUriFromDocument } from "../../utils/index";

export const onReferences = (serverState: ServerState) => {
  return (params: ReferenceParams) => {
    const { logger } = serverState;

    logger.trace("onReferences");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (!document) {
        return;
      }

      const documentURI = getUriFromDocument(document);
      const documentAnalyzer =
        serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

      if (!documentAnalyzer.isAnalyzed) {
        return;
      }

      return serverState.telemetry.trackTimingSync("onReferences", () =>
        new SolidityNavigation(
          serverState.languageServer.analyzer
        ).findReferences(
          documentURI,
          params.position,
          documentAnalyzer.analyzerTree.tree
        )
      );
    } catch (err) {
      logger.error(err);
    }
  };
};
