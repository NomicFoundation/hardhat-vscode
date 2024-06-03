import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";

// Highlights function definitions
export class FunctionDefinitionHighlighter extends Highlighter {
  public ruleKind = RuleKind.FunctionDefinition;
  public semanticTokenType = SemanticTokenTypes.function;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
