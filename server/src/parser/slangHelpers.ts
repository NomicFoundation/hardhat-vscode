import { NodeType, RuleNode, TokenNode } from "@nomicfoundation/slang/cst";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { TextRange } from "@nomicfoundation/slang/text_index";
import _ from "lodash";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Range } from "vscode-languageserver-types";
import { getPlatform } from "../utils/operatingSystem";

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
  const currentPlatform = getPlatform();

  return SUPPORTED_PLATFORMS.includes(currentPlatform);
}
