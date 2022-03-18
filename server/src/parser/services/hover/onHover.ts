import {
  isIdentifierNode,
  isMemberAccessNode,
} from "@analyzer/utils/typeGuards";
import { getParserPositionFromVSCodePosition } from "@common/utils";
import { getUriFromDocument } from "../../../utils/index";
import { HoverParams, Hover } from "vscode-languageserver/node";
import { ServerState } from "../../../types";
import {
  DocumentAnalyzer,
  IdentifierNode,
  MemberAccessNode,
} from "@common/types";
import { astToText } from "./utils/astToText";
import { textToHover } from "./utils/textTohover";

export function onHover(serverState: ServerState) {
  return (params: HoverParams): Hover | null => {
    const { languageServer, logger } = serverState;

    logger.trace("onHover");

    try {
      if (!languageServer) {
        return null;
      }

      const document = serverState.documents.get(params.textDocument.uri);

      if (!document) {
        return null;
      }

      const documentURI = getUriFromDocument(document);
      const documentAnalyzer =
        serverState.languageServer.analyzer.getDocumentAnalyzer(documentURI);

      if (!documentAnalyzer.isAnalyzed) {
        return null;
      }

      return serverState.telemetry.trackTimingSync("onHover", () =>
        findHoverForNodeAtPosition(documentAnalyzer, documentURI, params)
      );
    } catch (err) {
      logger.error(err);

      return null;
    }
  };
}

function findHoverForNodeAtPosition(
  documentAnalyzer: DocumentAnalyzer,
  documentURI: string,
  params: HoverParams
) {
  const node = documentAnalyzer.searcher.findNodeByPosition(
    documentURI,
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
