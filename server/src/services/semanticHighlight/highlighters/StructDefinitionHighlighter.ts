import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

// Highlights struct definitions
export class StructDefinitionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override readonly query = Query.parse(`
    [StructDefinition
      @identifier name: [_]
    ]
  `);
}
