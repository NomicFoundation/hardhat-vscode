import { SymbolKind } from "vscode-languageserver-types";
import { Query } from "@nomicfoundation/slang/query";
import { SymbolFinder } from "../SymbolFinder";

export class VariableDeclarationStatement extends SymbolFinder {
  public override readonly symbolKind = SymbolKind.Variable;

  public override readonly query = Query.parse(`
    @definition [VariableDeclarationStatement
      @identifier name: [_]
    ]
  `);
}
