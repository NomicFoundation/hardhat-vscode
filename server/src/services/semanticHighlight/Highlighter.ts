import { SemanticTokenTypes } from "vscode-languageserver-types";
import type {
  Query,
  QueryMatch,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";

// Abstraction for a visitor that wants to highlight tokens
export abstract class Highlighter {
  public abstract readonly semanticTokenType: SemanticTokenTypes;

  public async onResult(
    tokenBuilder: SemanticTokensBuilder,
    match: QueryMatch
  ) {
    // Ensure definition rule and name identifier are present
    const { identifier } = match.captures;

    if (identifier === undefined) {
      throw new Error(
        `Capture @identifier not present in query match.
         Query: '${await this.getQuery()}'
         Captures: ${JSON.stringify(match, undefined, 2)}`
      );
    }

    // Add the semantic token
    const identifierCursor = identifier[0];

    tokenBuilder.addToken(identifierCursor.textRange, this.semanticTokenType);
  }

  public abstract getQuery(): Promise<Query>;
}
