import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";

// Highlights function calls
export class FunctionCallHighlighter extends Highlighter {
  public ruleKind = RuleKind.FunctionCallExpression;
  public semanticTokenType = SemanticTokenTypes.function;

  public query = `
    @definition [${this.ruleKind}
      ...
      [Expression
        ...
        @identifier [Identifier]
        ...
      ]
      ...
    ]
  `;
}
