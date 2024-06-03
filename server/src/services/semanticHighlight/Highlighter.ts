/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { query } from "@nomicfoundation/slang/generated";
import { SemanticTokenTypes } from "vscode-languageserver-types";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";

// Abstraction for a visitor that wants to highlight tokens
export abstract class Highlighter {
  public abstract query: string;
  public abstract ruleKind: RuleKind;
  public abstract semanticTokenType: SemanticTokenTypes;

  constructor(public tokenBuilder: SemanticTokensBuilder) {}

  public onResult(result: query.QueryResult) {
    // Ensure definition rule and name identifier are present
    if (
      result.bindings.definition === undefined ||
      result.bindings.identifier === undefined
    ) {
      return;
    }

    // Check that the rule kind matches
    const definition = result.bindings.definition[0];
    const definitionNode = definition.node();

    if (definitionNode.kind !== this.ruleKind) {
      return;
    }

    // Add the semantic token
    const identifier = result.bindings.identifier[0];
    this.tokenBuilder.addToken(identifier.textRange, this.semanticTokenType);
  }
}
