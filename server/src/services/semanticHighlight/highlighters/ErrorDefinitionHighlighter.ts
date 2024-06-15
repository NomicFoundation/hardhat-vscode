import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

export class ErrorDefinitionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override readonly query = Query.parse(`
    [ErrorDefinition
      ...
      @identifier name: [_]
      ...
    ]
  `);
}
