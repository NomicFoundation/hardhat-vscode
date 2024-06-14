import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class ReceiveFunctionDefinition extends SymbolFinder {
  public ruleKind = RuleKind.ReceiveFunctionDefinition;
  public symbolKind = SymbolKind.Function;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [ReceiveKeyword]
      ...
    ]
  `;
}
