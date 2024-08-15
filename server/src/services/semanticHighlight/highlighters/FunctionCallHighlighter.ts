import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { Query } from "@nomicfoundation/slang/query";
import { Highlighter } from "../Highlighter";

// Highlights function calls
export class FunctionCallHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.function;

  public override readonly query = Query.parse(`
    [FunctionCallExpression
      [Expression
        @identifier [Identifier]
      ]
    ]
  `);
}
