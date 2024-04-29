import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType } from "@nomicfoundation/slang/cst";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNodeWrapper } from "../../../parser/slangHelpers";

// Highlights contract definitions
export class ContractDefinitionHighlighter extends HighlightVisitor {
  public tokenKinds = new Set([TokenKind.Identifier]);

  public enter(nodeWrapper: SlangNodeWrapper): void {
    const ancestors = nodeWrapper.ancestors();
    if (
      nodeWrapper.type === NodeType.Token &&
      nodeWrapper.kind === TokenKind.Identifier &&
      nodeWrapper.label === NodeLabel.Name &&
      ancestors[0]?.kind === RuleKind.ContractDefinition
    ) {
      this.tokenBuilder.addToken(nodeWrapper, SemanticTokenTypes.type);
    }
  }
}
