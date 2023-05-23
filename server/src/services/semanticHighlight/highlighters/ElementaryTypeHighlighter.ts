import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { NodeType, RuleKind } from "@nomicfoundation/slang";
import { HighlightVisitor } from "../HighlightVisitor";
import { SlangNode } from "../../../parser/slangHelpers";

// Highlights elementary type names
export class ElementaryTypeHighlighter extends HighlightVisitor {
  public enter(node: SlangNode, _ancestors: SlangNode[]): void {
    if (node.type === NodeType.Rule && node.kind === RuleKind.ElementaryType) {
      this.tokenBuilder.addToken(node, SemanticTokenTypes.type);
    }
  }
}
