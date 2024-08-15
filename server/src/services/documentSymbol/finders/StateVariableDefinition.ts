import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class StateVariableDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Property;

  public override readonly query = Query.parse(`
    @definition [StateVariableDefinition
      @identifier name: [_]
    ]
  `);
}
