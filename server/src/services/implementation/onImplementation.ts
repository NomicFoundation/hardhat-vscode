import { isFunctionDefinitionNode } from "@analyzer/utils/typeGuards";
import {
  ISolFileEntry,
  VSCodePosition,
  Location,
  Node,
  definitionNodeTypes,
  Overwrite,
  VSCodeLocation,
} from "@common/types";
import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { findReferencesFor } from "@utils/findReferencesFor";
import { onCommand } from "@utils/onCommand";
import { ImplementationParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { toUri } from "../../utils";

export const onImplementation = (serverState: ServerState) => {
  return (params: ImplementationParams) => {
    try {
      return onCommand(
        serverState,
        "onImplementation",
        params.textDocument.uri,
        (documentAnalyzer) =>
          findImplementation(serverState, documentAnalyzer, params.position)
      );
    } catch (err) {
      serverState.logger.error(err);
    }
  };
};

function findImplementation(
  serverState: ServerState,
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition
): VSCodeLocation[] {
  const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree
  );

  const referenceNodes: Node[] = findReferencesFor(definitionNode);

  const implementationNodes: Node[] = referenceNodes
    .filter(isDefinitionNode)
    .filter(isNotAbstractFunction);

  return implementationNodes
    .filter(
      (implNode): implNode is Overwrite<Node, { nameLoc: Location }> =>
        implNode.nameLoc !== undefined
    )
    .map((refNode) => ({
      uri: toUri(refNode.uri),
      range: getRange(refNode.nameLoc),
    }));
}

function isDefinitionNode(node: Node): boolean {
  return definitionNodeTypes.includes(node.type);
}

function isNotAbstractFunction(node: Node): boolean {
  return !(isFunctionDefinitionNode(node) && node.astNode.body === null);
}
