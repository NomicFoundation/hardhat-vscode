import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class VariableDeclaration extends SymbolVisitor {
  public ruleKind = RuleKind.VariableDeclaration;
  public symbolKind = SymbolKind.Variable;
  public nameTokenKind = TokenKind.Identifier;
}
