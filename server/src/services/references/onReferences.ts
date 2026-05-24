import {
  ISolFileEntry,
  VSCodePosition,
  Node,
  Location,
  VSCodeLocation,
  Overwrite,
} from "@common/types";
import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { findReferencesFor } from "@utils/findReferencesFor";
import { onCommand } from "@utils/onCommand";
import { ReferenceParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { toUri } from "../../utils";

export const onReferences = (serverState: ServerState) => {
  return (params: ReferenceParams) => {
    try {
      return onCommand(
        serverState,
        "onReferences",
        params.textDocument.uri,
        (documentAnalyzer) =>
          findReferences(serverState, documentAnalyzer, params.position)
      );
    } catch (err) {
      serverState.logger.error(err);
    }
  };
};

function findReferences(
  serverState: ServerState,
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition
): VSCodeLocation[] {
  const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree
  );

  // 先用原逻辑从 children 收集
  let references: Node[] = findReferencesFor(definitionNode);

  // fallback: children 不完整时, 从整个 analyzerTree 按名字搜索
  if (references.length === 0 && definitionNode !== undefined) {
    const nodeName = definitionNode.getName();
    if (nodeName !== undefined) {
      references = searchReferencesByName(
        nodeName,
        documentAnalyzer.analyzerTree.tree
      );
    }
  }

  return references
    .filter(
      (refNode): refNode is Overwrite<Node, { nameLoc: Location }> =>
        refNode.nameLoc !== undefined
    )
    .map((refNode) => ({
      uri: toUri(refNode.uri),
      range: getRange(refNode.nameLoc),
    }));
}

// 从整个分析树按名字递归搜索所有同名节点
function searchReferencesByName(
  name: string,
  rootNode: Node
): Node[] {
  const results: Node[] = [];
  const visited = new Set<Node>();

  function walk(node: Node): void {
    if (visited.has(node)) return;
    visited.add(node);

    if (node.getName() === name || node.getAliasName() === name) {
      results.push(node);
    }

    for (const child of node.children) {
      walk(child);
    }
  }

  walk(rootNode);
  return results;
}
