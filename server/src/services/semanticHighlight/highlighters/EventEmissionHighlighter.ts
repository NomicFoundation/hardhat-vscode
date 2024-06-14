import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";
import {} from "../../../parser/slangHelpers";

// Highlights event emissions
export class EventEmissionHighlighter extends Highlighter {
  public ruleKind = RuleKind.EmitStatement;
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
