import { NodeType, RuleNode, TokenNode } from "@nomicfoundation/slang";
import _ from "lodash";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Range } from "vscode-languageserver-types";

export type SlangNode = RuleNode | TokenNode;
export type NodeCallback = (node: SlangNode, ancestors: SlangNode[]) => void;

export function walk(
  node: SlangNode,
  onEnter: NodeCallback,
  onExit: NodeCallback,
  ancestors: SlangNode[] = []
) {
  onEnter(node, ancestors);

  ancestors.push(node);

  const children: SlangNode[] =
    node.type === NodeType.Rule ? node.children : [];

  for (const child of children) {
    walk(child, onEnter, onExit, ancestors);
  }

  ancestors.pop();

  onExit(node, ancestors);
}

export function slangToVSCodeRange(
  doc: TextDocument,
  slangRange: number[]
): Range {
  if (slangRange.length !== 2) {
    throw new Error(`Invalid slang rage: ${slangRange}`);
  }

  return {
    start: doc.positionAt(slangRange[0]),
    end: doc.positionAt(slangRange[1]),
  };
}
