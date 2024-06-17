import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class UserDefinedValueTypeDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.TypeParameter;

  public override readonly query = Query.parse(`
    @definition [UserDefinedValueTypeDefinition
      ...
      @identifier name: [_]
      ...
    ]
  `);
}
