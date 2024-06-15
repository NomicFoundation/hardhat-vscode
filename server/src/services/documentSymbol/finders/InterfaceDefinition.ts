import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class InterfaceDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Interface;

  public override readonly query = Query.parse(`
    @definition [InterfaceDefinition
      ...
      @identifier name: [_]
      ...
    ]
  `);
}
