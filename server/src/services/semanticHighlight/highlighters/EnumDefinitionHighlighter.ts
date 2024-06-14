import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";

export class EnumDefinitionHighlighter extends Highlighter {
  public ruleKind = RuleKind.EnumDefinition;
  public semanticTokenType = SemanticTokenTypes.type;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
