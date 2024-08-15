import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

// Highlights function definitions
export class FunctionDefinitionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.function;

  public override readonly query = Query.parse(`
    [FunctionDefinition
      [FunctionName
        @identifier [Identifier]
      ]
    ]
  `);
}
