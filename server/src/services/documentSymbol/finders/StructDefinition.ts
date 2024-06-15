import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class StructDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Struct;

  public override readonly query = Query.parse(`
    @definition [StructDefinition
      ...
      @identifier name: [_]
      ...
    ]
  `);
}
