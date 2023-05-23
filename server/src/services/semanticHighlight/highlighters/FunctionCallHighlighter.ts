import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType, RuleKind, TokenKind } from "@nomicfoundation/slang";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../../../parser/slangHelpers";

// Highlights function calls
export class FunctionCallHighlighter extends HighlightVisitor {
  public enter(node: SlangNode, _ancestors: SlangNode[]): void {
    if (
      node.type === NodeType.Token &&
      node.kind === TokenKind.Identifier &&
      _ancestors[_ancestors.length - 2]?.kind ===
        RuleKind.FunctionCallExpression
    ) {
      this.tokenBuilder.addToken(node, SemanticTokenTypes.function);
    }
  }
}
