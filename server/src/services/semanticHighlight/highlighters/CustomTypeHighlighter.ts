import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType } from "@nomicfoundation/slang/cst";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNodeWrapper } from "../../../parser/slangHelpers";

// Highlights custom type names
export class CustomTypeHighlighter extends HighlightVisitor {
  public tokenKinds = new Set([TokenKind.Identifier]);

  public enter(nodeWrapper: SlangNodeWrapper): void {
    const ancestors = nodeWrapper.ancestors();
    if (
      nodeWrapper.type === NodeType.Token &&
      nodeWrapper.kind === TokenKind.Identifier &&
      // NOTE: This only supports highlighting the first identifier in the path
      nodeWrapper.label === NodeLabel.Item &&
      ancestors[1]?.kind === RuleKind.TypeName
    ) {
      this.tokenBuilder.addToken(nodeWrapper, SemanticTokenTypes.type);
    }
  }
}
