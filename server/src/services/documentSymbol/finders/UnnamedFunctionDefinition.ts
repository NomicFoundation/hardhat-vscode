import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class UnnamedFunctionDefinition extends SymbolFinder {
  public ruleKind = RuleKind.UnnamedFunctionDefinition;
  public symbolKind = SymbolKind.Function;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [FunctionKeyword]
      ...
    ]
  `;
}
