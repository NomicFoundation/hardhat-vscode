import { SolidityNavigation } from "@services/navigation/SolidityNavigation";
import { TypeDefinitionParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { getUriFromDocument } from "../../utils/index";

export const onTypeDefinition = (serverState: ServerState) => {
  return (params: TypeDefinitionParams) => {
    const { logger } = serverState;

    logger.trace("onTypeDefinition");

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

      return serverState.telemetry.trackTimingSync("onTypeDefinition", () =>
        new SolidityNavigation(
          serverState.languageServer.analyzer
        ).findTypeDefinition(
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
