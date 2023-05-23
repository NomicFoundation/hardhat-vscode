import { DocumentSymbol, SymbolKind } from "vscode-languageserver-types";
import _ from "lodash";

export class SymbolTreeBuilder {
  public symbols: DocumentSymbol[] = [];
  public currentPath: Array<Partial<DocumentSymbol>> = [];

  public start(params: Partial<DocumentSymbol>) {
    const symbol = {
      kind: SymbolKind.Module,
      children: [],
      ...params,
    };

    this.currentPath.push(symbol);
  }

  public end() {
    const symbol = this.currentPath.pop() as DocumentSymbol;
    if (this.currentPath.length === 0) {
      this.symbols.push(symbol);
    } else {
      const lastSymbol = _.last(this.currentPath);

      if (!lastSymbol) {
        throw new Error("Attempting to close a symbol but none is open");
      }

      lastSymbol.children?.push(symbol);
    }
  }
}
