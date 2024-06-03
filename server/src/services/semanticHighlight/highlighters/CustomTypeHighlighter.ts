import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";

// Highlights custom type names
export class CustomTypeHighlighter extends Highlighter {
  public ruleKind = RuleKind.TypeName;
  public semanticTokenType = SemanticTokenTypes.type;

  public query = `
    @definition [${this.ruleKind}
      ...
      [IdentifierPath
        ...
        @identifier [Identifier]
        ...
      ]
      ...
    ]
  `;
}
