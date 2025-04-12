import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import type { Query } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { Highlighter } from "../Highlighter";

// Highlights contract definitions
export class ContractDefinitionHighlighter extends Highlighter {
  public override readonly semanticTokenType = SemanticTokenTypes.type;

  public override async getQuery(): Promise<Query> {
    const { Query } = await import("@nomicfoundation/slang/cst");
    return Query.create(`
    [ContractDefinition
      @identifier name: [_]
    ]
  `);
  }
}
