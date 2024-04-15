import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class VariableDeclaration extends SymbolVisitor {
  public ruleKind = RuleKind.VariableDeclarationStatement;
  public symbolKind = SymbolKind.Variable;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
