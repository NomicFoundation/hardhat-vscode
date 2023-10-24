import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { TokenKind } from "@nomicfoundation/slang/kinds";
import { NodeType } from "@nomicfoundation/slang/cst";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { HighlightVisitor } from "../HighlightVisitor";

const stringKinds = new Set([
  TokenKind.HexStringLiteral,
  TokenKind.AsciiStringLiteral,
  TokenKind.UnicodeStringLiteral,
]);

// Highlights strings
export class StringHighlighter extends HighlightVisitor {
  public enter(cursor: Cursor): void {
    const node = cursor.node;
    if (node.type === NodeType.Token && stringKinds.has(node.kind)) {
      this.tokenBuilder.addToken(cursor, SemanticTokenTypes.string);
    }
  }
}
