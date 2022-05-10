import {
  isIdentifierNode,
  isMemberAccessNode,
} from "@analyzer/utils/typeGuards";
import { getParserPositionFromVSCodePosition } from "@common/utils";
import { HoverParams, Hover } from "vscode-languageserver/node";
import { ISolFileEntry, IdentifierNode, MemberAccessNode } from "@common/types";
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
  const node = documentAnalyzer.searcher.findNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(params.position),
    documentAnalyzer.analyzerTree.tree
  );

  if (node === undefined) {
    return null;
  }

  if (!isIdentifierNode(node) && !isMemberAccessNode(node)) {
    return null;
  }

  return convertNodeToHover(node);
}

export function convertNodeToHover(
  node: IdentifierNode | MemberAccessNode
): Hover | null {
  const typeNode = node.typeNodes[0];

  if (typeNode === undefined) {
    return null;
  }

  const hoverText = astToText(typeNode.astNode);

  return textToHover(hoverText);
}
