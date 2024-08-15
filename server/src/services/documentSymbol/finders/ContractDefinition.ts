import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class ContractDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Class;

  public override readonly query = Query.parse(`
    @definition [ContractDefinition
      @identifier name: [_]
    ]
  `);
}
