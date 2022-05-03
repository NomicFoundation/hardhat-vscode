import { Node } from "@common/types";

export function findReferencesFor(definitionNode: Node | undefined): Node[] {
  const nodeName = definitionNode?.getName();

  if (!definitionNode || !nodeName) {
    return [];
  }

  const references: Node[] = [];
  extractReferencesFromNodeRecursive(nodeName, definitionNode, references);

  return references;
}

function extractReferencesFromNodeRecursive(
  name: string,
  node: Node,
  results: Node[],
  visitedNodes?: Node[]
): void {
  if (!visitedNodes) {
    visitedNodes = [];
  }

  if (visitedNodes.includes(node)) {
    return;
  }

  visitedNodes.push(node);

  if (name === node.getName() || name === node.getAliasName()) {
    results.push(node);
  }

  for (const child of node.children) {
    extractReferencesFromNodeRecursive(name, child, results, visitedNodes);
  }
}
