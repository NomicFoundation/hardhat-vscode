/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SymbolKind } from "vscode-languageserver-types";
import _ from "lodash";
import { TokenNode } from "@nomicfoundation/slang/cst";
import { query, text_index } from "@nomicfoundation/slang/generated";
import { RuleKind } from "@nomicfoundation/slang/kinds";

export interface SymbolData {
  range: text_index.TextRange;
  name: string;
  symbolKind: SymbolKind;
}

export abstract class SymbolFinder {
  public abstract ruleKind: RuleKind;
  public abstract symbolKind: SymbolKind;
  public abstract query: string;

  public onResult(result: query.QueryResult): SymbolData | undefined {
    // Ensure definition rule and name identifier are present
    if (
      result.bindings.definition === undefined ||
      result.bindings.identifier === undefined
    ) {
      throw new Error(
        `Bindings @definition or @identifier not present in query result. Query: ${
          this.query
        }, Bindings: ${JSON.stringify(result.bindings)}`
      );
    }

    // Check that the rule kind matches
    const definition = result.bindings.definition[0];

    const identifierNode = result.bindings.identifier[0].node() as TokenNode;

    return {
      range: definition.textRange,
      symbolKind: this.symbolKind,
      name: identifierNode.text,
    };
  }
}
