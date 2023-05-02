import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType, RuleKind, TokenKind } from "@nomicfoundation/slang";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../slangHelpers";

// Highlights function definitions
export class FunctionDefinitionHighlighter extends HighlightVisitor {
  public visit(node: SlangNode, _ancestors: SlangNode[]): void {
    if (
      node.type === NodeType.Token &&
      node.kind === TokenKind.Identifier &&
      _ancestors[_ancestors.length - 1]?.kind === RuleKind.FunctionDefinition
    ) {
      this.tokenBuilder.addToken(node, SemanticTokenTypes.function);
    }
  }
}
