import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

// Highlights interface definitions
export class InterfaceDefinitionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override readonly query = Query.parse(`
    [InterfaceDefinition
      @identifier name: [_]
    ]
  `);
}
