import { NodeType, RuleNode, TokenNode } from "@nomicfoundation/slang/cst";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { TextRange } from "@nomicfoundation/slang/text_index";
import _ from "lodash";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Range } from "vscode-languageserver-types";
import os from "os";

export type SlangNode = RuleNode | TokenNode;
export type NodeKind = RuleKind | TokenKind;
export type NodeCallback = (node: SlangNodeWrapper) => void;

export interface SlangNodeWrapper {
  textRange: TextRange;
  type: NodeType;
  kind: NodeKind;
  text: string;
  pathRuleNodes: SlangNode[];
}

export function walk(
  cursor: Cursor,
  onEnter: NodeCallback,
  onExit: NodeCallback
) {
  const node = cursor.node;

  const nodeWrapper: SlangNodeWrapper = {
    textRange: cursor.textRange,
    type: node.type,
    kind: node.kind,
    text: node.text,
    pathRuleNodes: cursor.pathRuleNodes,
  };

  onEnter(nodeWrapper);

  if (nodeWrapper.type === NodeType.Rule) {
    for (let i = 0; i < node.children.length; i++) {
      cursor.goToNthChild(i);
      walk(cursor, onEnter, onExit);
    }
  }
  onExit(nodeWrapper);
  cursor.goToParent();
}

export function slangToVSCodeRange(
  doc: TextDocument,
  slangRange: TextRange
): Range {
  return {
    start: doc.positionAt(slangRange.start.utf16),
    end: doc.positionAt(slangRange.end.utf16),
  };
}

const SUPPORTED_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-arm64",
  "win32-ia32",
  "win32-x64",
];
export function isSlangSupported() {
  const currentPlatform = `${os.platform()}-${os.arch()}`;

  return SUPPORTED_PLATFORMS.includes(currentPlatform);
}
