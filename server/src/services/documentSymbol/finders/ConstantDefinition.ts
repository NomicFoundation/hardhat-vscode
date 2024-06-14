import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class ConstantDefinition extends SymbolFinder {
  public ruleKind = RuleKind.ConstantDefinition;
  public symbolKind = SymbolKind.Constant;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
