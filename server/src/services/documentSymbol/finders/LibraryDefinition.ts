import { SymbolKind } from "vscode-languageserver-types";
import type { Query } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { SymbolFinder } from "../SymbolFinder";

export class LibraryDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Class;

  public override async getQuery(): Promise<Query> {
    const { Query } = await import("@nomicfoundation/slang/cst");
    return Query.create(`
      @definition [LibraryDefinition
        @identifier name: [_]
      ]
    `);
  }
}
