import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { TokenKind } from "@nomicfoundation/slang/kinds";
import { NodeType } from "@nomicfoundation/slang/cst";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { HighlightVisitor } from "../HighlightVisitor";

const numberKinds = new Set([
  TokenKind.HexLiteral,
  TokenKind.YulHexLiteral,
  TokenKind.DecimalLiteral,
]);

// Highlights numbers
export class NumberHighlighter extends HighlightVisitor {
  public enter(cursor: Cursor): void {
    const node = cursor.node;
    if (node.type === NodeType.Token && numberKinds.has(node.kind)) {
      this.tokenBuilder.addToken(cursor, SemanticTokenTypes.number);
    }
  }
}
