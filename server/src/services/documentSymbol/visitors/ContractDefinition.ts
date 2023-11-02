import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ContractDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ContractDefinition;
  public symbolKind = SymbolKind.Class;
  public nameTokenKind = TokenKind.Identifier;
}
