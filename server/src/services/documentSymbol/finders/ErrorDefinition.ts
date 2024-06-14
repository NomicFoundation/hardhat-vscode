import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class ErrorDefinition extends SymbolFinder {
  public ruleKind = RuleKind.ErrorDefinition;
  public symbolKind = SymbolKind.Event;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
