import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class ContractDefinition extends SymbolFinder {
  public ruleKind = RuleKind.ContractDefinition;
  public symbolKind = SymbolKind.Class;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
