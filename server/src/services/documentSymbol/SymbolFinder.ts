/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SymbolKind } from "vscode-languageserver-types";
import _ from "lodash";
import { TerminalNode } from "@nomicfoundation/slang/cst";
import { TextRange } from "@nomicfoundation/slang/text_index";
import { Query, QueryMatch } from "@nomicfoundation/slang/query";

export interface SymbolData {
  range: TextRange;
  name: string;
  symbolKind: SymbolKind;
}

export abstract class SymbolFinder {
  public abstract readonly symbolKind: SymbolKind;
  public abstract readonly query: Query;

  public findSymbol(match: QueryMatch): SymbolData {
    // Ensure definition rule and name identifier are present
    const { definition, identifier } = match.captures;

    if (definition === undefined || identifier === undefined) {
      throw new Error(
        `Captures @definition or @identifier not present in query match.
         Query: '${this.query}'
         Captures: ${JSON.stringify(match, undefined, 2)}`
      );
    }

    const definitionCursor = definition[0];
    const identifierNode = identifier[0].node() as TerminalNode;

    return {
      range: definitionCursor.textRange,
      symbolKind: this.symbolKind,
      name: identifierNode.text,
    };
  }
}
