import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class YulFunctionDefinition extends SymbolFinder {
  public ruleKind = RuleKind.YulFunctionDefinition;
  public symbolKind = SymbolKind.Function;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
