import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ContractDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ContractDefinition;
  public symbolKind = SymbolKind.Class;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
