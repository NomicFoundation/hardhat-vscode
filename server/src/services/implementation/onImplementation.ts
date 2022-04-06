import { SolidityNavigation } from "@services/navigation/SolidityNavigation";
import { ImplementationParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { getUriFromDocument } from "../../utils/index";

export const onImplementation = (serverState: ServerState) => {
  return (params: ImplementationParams) => {
    const { logger } = serverState;

    logger.trace("onImplementation");

    try {
      const document = serverState.documents.get(params.textDocument.uri);

      if (!document) {
        return;
      }

      const documentURI = getUriFromDocument(document);
      const documentAnalyzer =
        serverState.analyzer.getDocumentAnalyzer(documentURI);

      if (!documentAnalyzer.isAnalyzed) {
        return;
      }

      return serverState.telemetry.trackTimingSync("onImplementation", () =>
        new SolidityNavigation(serverState.analyzer).findImplementation(
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
