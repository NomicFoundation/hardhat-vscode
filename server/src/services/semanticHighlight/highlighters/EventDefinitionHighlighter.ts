import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

// Highlights event definitions
export class EventDefinitionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override readonly query = Query.parse(`
    [EventDefinition
      @identifier name: [_]
    ]
  `);
}
