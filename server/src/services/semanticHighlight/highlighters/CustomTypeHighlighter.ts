import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType, RuleKind, TokenKind } from "@nomicfoundation/slang";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../../../parser/slangHelpers";

// Highlights custom type names
export class CustomTypeHighlighter extends HighlightVisitor {
  public enter(node: SlangNode, _ancestors: SlangNode[]): void {
    if (
      node.type === NodeType.Token &&
      node.kind === TokenKind.Identifier &&
      _ancestors[_ancestors.length - 3]?.kind === RuleKind.TypeName
    ) {
      this.tokenBuilder.addToken(node, SemanticTokenTypes.type);
    }
  }
}
