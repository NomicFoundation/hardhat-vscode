import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class StructMember extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Property;

  public override readonly query = Query.parse(`
    @definition [StructMember
      @identifier name: [_]
    ]
  `);
}
