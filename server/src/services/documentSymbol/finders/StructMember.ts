import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { SymbolFinder } from "../SymbolFinder";

export class StructMember extends SymbolFinder {
  public ruleKind = RuleKind.StructMember;
  public symbolKind = SymbolKind.Property;

  public query = `
    @definition [${this.ruleKind}
      ...
      @identifier [name:_]
      ...
    ]
  `;
}
