import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class StateVariableDeclaration extends SymbolVisitor {
  public ruleKind = RuleKind.StateVariableDefinition;
  public symbolKind = SymbolKind.Property;
  public nameTokenKind = TokenKind.Identifier;
}
