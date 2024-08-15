import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class ModifierDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Function;

  public override readonly query = Query.parse(`
    @definition [ModifierDefinition
      @identifier name: [_]
    ]
  `);
}
