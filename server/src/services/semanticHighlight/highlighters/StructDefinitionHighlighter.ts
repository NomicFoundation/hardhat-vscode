import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";

// Highlights struct definitions
export class StructDefinitionHighlighter extends Highlighter {
  public ruleKind = RuleKind.StructDefinition;
  public semanticTokenType = SemanticTokenTypes.type;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
