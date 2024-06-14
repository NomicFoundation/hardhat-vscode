import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Highlighter } from "../Highlighter";

export class LibraryDefinitionHighlighter extends Highlighter {
  public ruleKind = RuleKind.LibraryDefinition;
  public semanticTokenType = SemanticTokenTypes.type;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
