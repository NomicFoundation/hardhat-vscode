import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class StateVariableDefinition extends SymbolFinder {
  public ruleKind = RuleKind.StateVariableDefinition;
  public symbolKind = SymbolKind.Property;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
