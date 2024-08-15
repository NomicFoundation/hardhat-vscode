import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class ConstructorDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Constructor;

  public override readonly query = Query.parse(`
    @definition [ConstructorDefinition
      @identifier [ConstructorKeyword]
    ]
  `);
}
