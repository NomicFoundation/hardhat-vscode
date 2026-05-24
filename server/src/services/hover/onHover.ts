import {
  isIdentifierNode,
  isMemberAccessNode,
  isUserDefinedTypeNameNode,
} from "@analyzer/utils/typeGuards";
import { getParserPositionFromVSCodePosition } from "@common/utils";
import { HoverParams, Hover } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  ISolFileEntry,
  IdentifierNode,
  MemberAccessNode,
  Node,
  Position,
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
        (documentAnalyzer, document) =>
          findHoverForNodeAtPosition(documentAnalyzer, document, params)
      );
    } catch (err) {
      serverState.logger.error(err);

      return null;
    }
  };
}

function findHoverForNodeAtPosition(
  documentAnalyzer: ISolFileEntry,
  document: TextDocument,
  params: HoverParams
) {
  const position = getParserPositionFromVSCodePosition(params.position);

  // 完全复用 goToDefinition 的方式查找定义节点
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

  // fallback: 原始 typeNodes 逻辑 (仅对声明位置有效)
  const node = documentAnalyzer.searcher.findNodeByPosition(
    documentAnalyzer.uri,
    position,
    documentAnalyzer.analyzerTree.tree
  );

  if (
    node !== undefined &&
    (isIdentifierNode(node) ||
      isMemberAccessNode(node) ||
      isUserDefinedTypeNameNode(node))
  ) {
    const typeNode = node.typeNodes[0];
    if (typeNode !== undefined) {
      const hoverText = astToText(typeNode.astNode);
      if (hoverText !== null) {
        return textToHover(hoverText);
      }
    }
  }

  // fallback: orphanNodes 搜索
  const orphanNode = findNodeInOrphans(documentAnalyzer.orphanNodes, position);
  if (orphanNode !== undefined) {
    const defNode = orphanNode.getDefinitionNode() ?? orphanNode;
    const hoverText = astToText(defNode.astNode);
    return textToHover(hoverText);
  }

  // fallback: 从源文本提取标识符, 按名字搜索定义节点
  const word = extractIdentifierAtPosition(document, params.position);
  if (word !== null) {
    const foundNode = searchDefinitionByName(
      word,
      documentAnalyzer.analyzerTree.tree,
      documentAnalyzer.orphanNodes
    );
    if (foundNode) {
      const hoverText = astToText(foundNode.astNode);
      if (hoverText !== null) {
        return textToHover(hoverText);
      }
    }
  }

  return null;
}

// 从 orphanNodes 中按位置查找节点
function findNodeInOrphans(
  orphanNodes: Node[],
  position: Position
): Node | undefined {
  for (const node of orphanNodes) {
    if (
      node.nameLoc &&
      node.nameLoc.start.line === position.line &&
      node.nameLoc.end.line === position.line &&
      node.nameLoc.start.column <= position.column &&
      node.nameLoc.end.column >= position.column
    ) {
      return node;
    }
  }
  return undefined;
}

// 从整个分析树按名字搜索定义节点
function searchDefinitionByName(
  name: string,
  rootNode: Node,
  orphanNodes: Node[]
): Node | undefined {
  const visited = new Set<Node>();
  const candidates: Node[] = [];

  function walk(node: Node): void {
    if (visited.has(node)) return;
    visited.add(node);

    if (node.getName() === name) {
      const defNode = node.getDefinitionNode() ?? node;
      candidates.push(defNode);
    }

    for (const child of node.children) {
      walk(child);
    }
  }

  walk(rootNode);

  // 也搜索 orphanNodes
  for (const orphan of orphanNodes) {
    if (orphan.getName() === name) {
      candidates.push(orphan.getDefinitionNode() ?? orphan);
    }
  }

  if (candidates.length === 0) return undefined;

  // 多个引用可能指向同一个定义, 直接返回第一个
  return candidates[0];
}

// 从源文本中提取光标位置的标识符
function extractIdentifierAtPosition(
  document: TextDocument,
  position: { line: number; character: number }
): string | null {
  const lineText = document.getText({
    start: { line: position.line, character: 0 },
    end: { line: position.line, character: 65535 },
  });

  const char = Math.min(position.character, lineText.length);

  // 向左扫描找到标识符起始位置
  let start = char;
  while (start > 0 && /[a-zA-Z0-9_]/.test(lineText[start - 1])) {
    start--;
  }

  // 向右扫描找到标识符结束位置
  let end = char;
  while (end < lineText.length && /[a-zA-Z0-9_]/.test(lineText[end])) {
    end++;
  }

  if (start === end) return null;

  return lineText.substring(start, end);
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
