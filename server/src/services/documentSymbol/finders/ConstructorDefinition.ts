import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class ConstructorDefinition extends SymbolFinder {
  public ruleKind = RuleKind.ConstructorDefinition;
  public symbolKind = SymbolKind.Constructor;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [ConstructorKeyword]
      ...
    ]
  `;
}
