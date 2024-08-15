import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

export class EnumDefinitionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override readonly query = Query.parse(`
    [EnumDefinition
      @identifier name: [_]
    ]
  `);
}
