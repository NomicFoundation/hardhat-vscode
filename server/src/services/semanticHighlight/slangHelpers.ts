import { NodeType, RuleNode, TokenNode } from "@nomicfoundation/slang";
import _ from "lodash";

export type SlangNode = RuleNode | TokenNode;
export type NodeCallback = (node: SlangNode, ancestors: SlangNode[]) => void;

export function walk(
  node: SlangNode,
  onNode: NodeCallback,
  ancestors: SlangNode[] = []
) {
  onNode(node, ancestors);

  ancestors.push(node);

  const children: SlangNode[] =
    node.type === NodeType.Rule ? node.children : [];

  for (const child of children) {
    walk(child, onNode, ancestors);
  }

  ancestors.pop();
}
