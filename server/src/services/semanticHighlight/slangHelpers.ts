import { NodeType, RuleNode, TokenNode } from "@nomicfoundation/slang";
import _ from "lodash";

export type SlangNode = RuleNode | TokenNode;
export type NodeCallback = (node: SlangNode, ancestors: SlangNode[]) => void;

export function visit(
  node: SlangNode,
  onNode: NodeCallback,
  ancestors: SlangNode[] = []
) {
  onNode(node, ancestors);

  ancestors.push(node);

  const children: SlangNode[] =
    node.type === NodeType.Rule ? node.children() : node.trivia();

  for (const child of children) {
    visit(child, onNode, ancestors);
  }

  ancestors.pop();
}
