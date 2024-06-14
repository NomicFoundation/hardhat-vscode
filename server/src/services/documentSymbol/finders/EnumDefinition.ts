import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class EnumDefinition extends SymbolFinder {
  public ruleKind = RuleKind.EnumDefinition;
  public symbolKind = SymbolKind.Enum;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
