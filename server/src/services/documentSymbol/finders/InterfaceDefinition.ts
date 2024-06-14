import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class InterfaceDefinition extends SymbolFinder {
  public ruleKind = RuleKind.InterfaceDefinition;
  public symbolKind = SymbolKind.Interface;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
