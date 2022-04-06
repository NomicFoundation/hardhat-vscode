import {
  DocumentAnalyzer,
  VSCodePosition,
  Node,
  Location,
  Overwrite,
} from "@common/types";
import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { convertHardhatUriToVscodeUri } from "@utils/index";
import { onCommand } from "@utils/onCommand";
import { TypeDefinitionParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";

export const onTypeDefinition = (serverState: ServerState) => {
  return (params: TypeDefinitionParams) => {
    try {
      return onCommand(
        serverState,
        "onTypeDefinition",
        params.textDocument.uri,
        (documentAnalyzer) =>
          findTypeDefinition(serverState, documentAnalyzer, params.position)
      );
    } catch (err) {
      serverState.logger.error(err);

      return null;
    }
  };
};

function findTypeDefinition(
  serverState: ServerState,
  documentAnalyzer: DocumentAnalyzer,
  position: VSCodePosition
) {
  const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree
  );

  if (!definitionNode) {
    return [];
  }

  return definitionNode
    .getTypeNodes()
    .filter(
      (typeNode): typeNode is Overwrite<Node, { nameLoc: Location }> =>
        typeNode.nameLoc !== undefined
    )
    .map((typeNode) => ({
      uri: convertHardhatUriToVscodeUri(typeNode.uri),
      range: getRange(typeNode.nameLoc),
    }));
}
