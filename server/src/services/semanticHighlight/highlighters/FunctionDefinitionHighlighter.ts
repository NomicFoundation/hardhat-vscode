import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType } from "@nomicfoundation/slang/cst";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNodeWrapper } from "../../../parser/slangHelpers";

// Highlights function definitions
export class FunctionDefinitionHighlighter extends HighlightVisitor {
  public tokenKinds = new Set([TokenKind.Identifier]);

  public enter(nodeWrapper: SlangNodeWrapper): void {
    const ancestors = nodeWrapper.ancestors();
    if (
      nodeWrapper.type === NodeType.Token &&
      nodeWrapper.kind === TokenKind.Identifier &&
      // TODO: Support also 'receive' and 'fallback' functions post 0.6.0
      nodeWrapper.name === FieldName.Variant &&
      ancestors[ancestors.length - 2]?.kind === RuleKind.FunctionDefinition
    ) {
      this.tokenBuilder.addToken(nodeWrapper, SemanticTokenTypes.function);
    }
  }
}
