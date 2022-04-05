import { DefinitionParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { getUriFromDocument } from "../../utils/index";

export const onDefinition = (serverState: ServerState) => {
  return (params: DefinitionParams) => {
    const { logger } = serverState;

    logger.trace("onDefinition");

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

      return serverState.telemetry.trackTimingSync("onDefinition", () =>
        serverState.languageServer.solidityNavigation.findDefinition(
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
