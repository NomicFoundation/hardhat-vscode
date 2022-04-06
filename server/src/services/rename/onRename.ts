import { RenameParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { getUriFromDocument } from "../../utils/index";
import { SolidityRename } from "./SolidityRename";

export const onRename = (serverState: ServerState) => {
  return (params: RenameParams) => {
    const { logger } = serverState;

    logger.trace("onRenameRequest");

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

      return serverState.telemetry.trackTimingSync("onRenameRequest", () =>
        new SolidityRename(serverState.languageServer.analyzer).doRename(
          documentURI,
          params.position,
          params.newName,
          documentAnalyzer.analyzerTree.tree
        )
      );
    } catch (err) {
      logger.error(err);
    }
  };
};
