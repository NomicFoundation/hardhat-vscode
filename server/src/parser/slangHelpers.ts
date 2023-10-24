import { NodeType, RuleNode, TokenNode } from "@nomicfoundation/slang/cst";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { TextRange } from "@nomicfoundation/slang/text_index";
import _ from "lodash";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Range } from "vscode-languageserver-types";

export type SlangNode = RuleNode | TokenNode;
export type NodeCallback = (cursor: Cursor) => void;

export function walk(
  cursor: Cursor,
  onEnter: NodeCallback,
  onExit: NodeCallback
) {
  onEnter(cursor);

  if (cursor.node.type === NodeType.Rule) {
    for (let i = 0; i < cursor.node.children.length; i++) {
      cursor.goToNthChild(i);
      walk(cursor, onEnter, onExit);
    }
  }
  onExit(cursor);
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
