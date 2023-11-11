import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { TokenKind } from "@nomicfoundation/slang/kinds";
import { NodeType } from "@nomicfoundation/slang/cst";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNodeWrapper } from "../../../parser/slangHelpers";

const stringKinds = new Set([
  TokenKind.HexStringLiteral,
  TokenKind.AsciiStringLiteral,
  TokenKind.UnicodeStringLiteral,
]);

// Highlights strings
export class StringHighlighter extends HighlightVisitor {
  public tokenKinds = stringKinds;

  public enter(nodeWrapper: SlangNodeWrapper): void {
    if (
      nodeWrapper.type === NodeType.Token &&
      stringKinds.has(nodeWrapper.kind as TokenKind)
    ) {
      this.tokenBuilder.addToken(nodeWrapper, SemanticTokenTypes.string);
    }
  }
}
