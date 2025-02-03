import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import type { Query } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { Highlighter } from "../Highlighter";

export class FunctionCallHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.function;

  public override async getQuery(): Promise<Query> {
    const { Query } = await import("@nomicfoundation/slang/cst");
    return Query.create(`
    [FunctionCallExpression
      [Expression
        @identifier [Identifier]
      ]
    ]
  `);
  }
}
