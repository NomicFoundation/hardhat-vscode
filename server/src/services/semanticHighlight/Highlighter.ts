import { SemanticTokenTypes } from "vscode-languageserver-types";
import { Query, QueryMatch } from "@nomicfoundation/slang/query";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";

// Abstraction for a visitor that wants to highlight tokens
export abstract class Highlighter {
  public abstract readonly semanticTokenType: SemanticTokenTypes;
  public abstract readonly query: Query;

  public onResult(tokenBuilder: SemanticTokensBuilder, match: QueryMatch) {
    // Ensure definition rule and name identifier are present
    const { identifier } = match.captures;

    if (identifier === undefined) {
      throw new Error(
        `Capture @identifier not present in query match.
         Query: '${this.query}'
         Captures: ${JSON.stringify(match, undefined, 2)}`
      );
    }

    // Add the semantic token
    const identifierCursor = identifier[0];

    tokenBuilder.addToken(identifierCursor.textRange, this.semanticTokenType);
  }
}
