import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class EnumDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Enum;

  public override readonly query = Query.parse(`
    @definition [EnumDefinition
      ...
      @identifier name: [_]
      ...
    ]
  `);
}
