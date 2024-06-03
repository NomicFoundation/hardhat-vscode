import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class StructDefinition extends SymbolFinder {
  public ruleKind = RuleKind.StructDefinition;
  public symbolKind = SymbolKind.Struct;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
