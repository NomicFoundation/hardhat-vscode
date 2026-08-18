import {
  isIdentifierNode,
  isMemberAccessNode,
  isUserDefinedTypeNameNode,
} from "@analyzer/utils/typeGuards";
import { getParserPositionFromVSCodePosition } from "@common/utils";
import { HoverParams, Hover } from "vscode-languageserver/node";
import {
  ISolFileEntry,
  IdentifierNode,
  MemberAccessNode,
  Node,
} from "@common/types";
import { onCommand } from "@utils/onCommand";
import { ServerState } from "../../types";
import { astToText } from "./utils/astToText";
import { textToHover } from "./utils/textTohover";

export function onHover(serverState: ServerState) {
  return (params: HoverParams): Hover | null => {
    try {
      return onCommand(
        serverState,
        "onHover",
        params.textDocument.uri,
        (documentAnalyzer) =>
          findHoverForNodeAtPosition(documentAnalyzer, params)
      );
    } catch (err) {
      serverState.logger.error(err);

      return null;
    }
  };
}

function findHoverForNodeAtPosition(
  documentAnalyzer: ISolFileEntry,
  params: HoverParams
) {
  const position = getParserPositionFromVSCodePosition(params.position);

  // Resolve through the parent chain, the same lookup goToDefinition uses.
  // Unlike `typeNodes`, it is populated on declarations, so hovering a
  // declaration describes the declaration itself rather than returning nothing.
  const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
    documentAnalyzer.uri,
    position,
    documentAnalyzer.analyzerTree.tree
  );

  if (definitionNode !== undefined) {
    const hoverText = astToText(definitionNode.astNode);

    if (hoverText !== null) {
      return textToHover(hoverText);
    }
  }

  // Fall back to the type nodes recorded by `usedef`.
  const node = documentAnalyzer.searcher.findNodeByPosition(
    documentAnalyzer.uri,
    position,
    documentAnalyzer.analyzerTree.tree
  );

  if (node === undefined) {
    return null;
  }

  if (
    !isIdentifierNode(node) &&
    !isMemberAccessNode(node) &&
    !isUserDefinedTypeNameNode(node)
  ) {
    return null;
  }

  return convertNodeToHover(node);
}

export function convertNodeToHover(
  node: IdentifierNode | MemberAccessNode | Node
): Hover | null {
  const typeNode = node.typeNodes[0];

  if (typeNode === undefined) {
    return null;
  }

  const hoverText = astToText(typeNode.astNode);

  return textToHover(hoverText);
}
