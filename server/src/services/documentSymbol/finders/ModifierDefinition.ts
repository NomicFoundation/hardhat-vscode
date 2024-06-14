import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class ModifierDefinition extends SymbolFinder {
  public ruleKind = RuleKind.ModifierDefinition;
  public symbolKind = SymbolKind.Function;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
