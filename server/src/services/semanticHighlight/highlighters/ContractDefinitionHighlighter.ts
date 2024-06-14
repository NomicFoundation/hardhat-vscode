import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";

// Highlights contract definitions
export class ContractDefinitionHighlighter extends Highlighter {
  public ruleKind = RuleKind.ContractDefinition;
  public semanticTokenType = SemanticTokenTypes.type;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
