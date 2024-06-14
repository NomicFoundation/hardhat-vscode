import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class FunctionDefinition extends SymbolFinder {
  public ruleKind = RuleKind.FunctionDefinition;
  public symbolKind = SymbolKind.Function;

  public query = `
    @definition [${this.ruleKind}
      ...
      [FunctionName
        ...
        @identifier [variant:_]
        ...
      ]
      ...
    ]
  `;
}
