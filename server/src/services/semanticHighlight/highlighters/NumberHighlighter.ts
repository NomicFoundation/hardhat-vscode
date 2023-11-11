import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { TokenKind } from "@nomicfoundation/slang/kinds";
import { NodeType, TokenNode } from "@nomicfoundation/slang/cst";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNodeWrapper } from "../../../parser/slangHelpers";

const numberKinds = new Set([
  TokenKind.HexLiteral,
  TokenKind.YulHexLiteral,
  TokenKind.DecimalLiteral,
]);

// Highlights numbers
export class NumberHighlighter extends HighlightVisitor {
  public tokenKinds = numberKinds;

  public enter(nodeWrapper: SlangNodeWrapper): void {
    if (
      nodeWrapper.type === NodeType.Token &&
      numberKinds.has(nodeWrapper.kind as TokenKind)
    ) {
      this.tokenBuilder.addToken(nodeWrapper, SemanticTokenTypes.number);
    }
  }
}
