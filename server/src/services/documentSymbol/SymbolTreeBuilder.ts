/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DocumentSymbol } from "vscode-languageserver-types";
import _ from "lodash";

export class SymbolTreeBuilder {
  private symbols: DocumentSymbol[] = [];
  private currentPath: Array<Partial<DocumentSymbol>> = [];

  public openSymbol(params: Partial<DocumentSymbol>) {
    const symbol = {
      children: [],
      ...params,
    };

    this.currentPath.push(symbol);
  }

  public closeSymbol() {
    const symbol = this.currentPath.pop() as DocumentSymbol;

    if (symbol.name === undefined) {
      return;
    }

    if (this.currentPath.length === 0) {
      this.symbols.push(symbol);
    } else {
      const lastSymbol = this.lastOpenSymbol();

      if (!lastSymbol) {
        throw new Error("Attempting to close a symbol but none is open");
      }

      lastSymbol.children!.push(symbol);
    }
  }

  public lastOpenSymbol() {
    return _.last(this.currentPath);
  }

  public getSymbols() {
    // Close any left open symbols
    while (this.lastOpenSymbol()) {
      this.closeSymbol();
    }

    return this.symbols;
  }
}
