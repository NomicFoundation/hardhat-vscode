import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

// Highlights custom type names
export class CustomTypeHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override readonly query = Query.parse(`
    [TypeName
      ...
      [IdentifierPath
        ...
        @identifier [Identifier]
        ...
      ]
      ...
    ]
  `);
}
