import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class UnnamedFunctionDefinition extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Function;

  public override readonly query = Query.parse(`
    @definition [UnnamedFunctionDefinition
      @identifier [FunctionKeyword]
    ]
  `);
}
