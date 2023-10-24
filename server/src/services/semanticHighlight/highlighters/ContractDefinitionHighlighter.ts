import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType } from "@nomicfoundation/slang/cst";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { HighlightVisitor } from "../HighlightVisitor";

// Highlights contract definitions
export class ContractDefinitionHighlighter extends HighlightVisitor {
  public enter(cursor: Cursor): void {
    const node = cursor.node;
    const ancestors = cursor.pathRuleNodes;
    if (
      node.type === NodeType.Token &&
      node.kind === TokenKind.Identifier &&
      ancestors[ancestors.length - 1]?.kind === RuleKind.ContractDefinition
    ) {
      this.tokenBuilder.addToken(cursor, SemanticTokenTypes.type);
    }
  }
}
