import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";
import {} from "../../../parser/slangHelpers";

// Highlights event emissions
export class EventEmissionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override readonly query = Query.parse(`
    [EmitStatement
      [IdentifierPath
        @identifier [Identifier]
      ]
    ]
  `);
}
