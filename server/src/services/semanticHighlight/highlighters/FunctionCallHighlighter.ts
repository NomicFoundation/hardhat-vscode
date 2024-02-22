import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType } from "@nomicfoundation/slang/cst";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNodeWrapper } from "../../../parser/slangHelpers";

// Highlights function calls
export class FunctionCallHighlighter extends HighlightVisitor {
  public tokenKinds = new Set([TokenKind.Identifier]);

  public enter(nodeWrapper: SlangNodeWrapper): void {
    const ancestors = nodeWrapper.ancestors();
    if (
      nodeWrapper.type === NodeType.Token &&
      nodeWrapper.kind === TokenKind.Identifier &&
      // NOTE: This only supports the basic case of a function call with positional arguments "(a,b,c)"
      ancestors[ancestors.length - 2]?.kind === RuleKind.FunctionCallExpression
    ) {
      this.tokenBuilder.addToken(nodeWrapper, SemanticTokenTypes.function);
    }
  }
}
