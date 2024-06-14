import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class VariableDeclarationStatement extends SymbolFinder {
  public ruleKind = RuleKind.VariableDeclarationStatement;
  public symbolKind = SymbolKind.Variable;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
