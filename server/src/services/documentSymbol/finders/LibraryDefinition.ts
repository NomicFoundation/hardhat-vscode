import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class LibraryDefinition extends SymbolFinder {
  public ruleKind = RuleKind.LibraryDefinition;
  public symbolKind = SymbolKind.Class;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
