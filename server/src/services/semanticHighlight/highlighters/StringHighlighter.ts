import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType, TokenKind } from "@nomicfoundation/slang";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../slangHelpers";

const stringKinds = new Set([
  TokenKind.HexStringLiteral,
  TokenKind.AsciiStringLiteral,
  TokenKind.UnicodeStringLiteral,
  TokenKind.DoubleQuotedAsciiStringLiteral,
  TokenKind.SingleQuotedAsciiStringLiteral,
  TokenKind.DoubleQuotedUnicodeStringLiteral,
  TokenKind.SingleQuotedUnicodeStringLiteral,
]);

// Highlights strings
export class StringHighlighter extends HighlightVisitor {
  public visit(node: SlangNode, _ancestors: SlangNode[]): void {
    if (node.type === NodeType.Token && stringKinds.has(node.kind)) {
      this.tokenBuilder.addToken(node, SemanticTokenTypes.string);
    }
  }
}
