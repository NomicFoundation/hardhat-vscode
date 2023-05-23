import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType, TokenKind } from "@nomicfoundation/slang";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../../../parser/slangHelpers";

const numberKinds = new Set([
  TokenKind.HexLiteral,
  TokenKind.YulHexLiteral,
  TokenKind.DecimalLiteral,
]);

// Highlights numbers
export class NumberHighlighter extends HighlightVisitor {
  public enter(node: SlangNode, _ancestors: SlangNode[]): void {
    if (node.type === NodeType.Token && numberKinds.has(node.kind)) {
      this.tokenBuilder.addToken(node, SemanticTokenTypes.number);
    }
  }
}
