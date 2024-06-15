import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class ConstantDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Constant;

  public override readonly query = Query.parse(`
    @definition [ConstantDefinition
      ...
      @identifier name: [_]
      ...
    ]
  `);
}
