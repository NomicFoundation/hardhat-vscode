import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class InterfaceDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.InterfaceDefinition;
  public symbolKind = SymbolKind.Interface;
  public nameTokenKind = TokenKind.Identifier;
}
