import { SymbolKind } from "vscode-languageserver-types";
import type { Query } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { SymbolFinder } from "../SymbolFinder";

export class ConstantDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Constant;

  public override async getQuery(): Promise<Query> {
    const { Query } = await import("@nomicfoundation/slang/cst");
    return Query.create(`
      @definition [ConstantDefinition
        @identifier name: [_]
      ]
    `);
  }
}
