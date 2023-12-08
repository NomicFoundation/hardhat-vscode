import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class UnnamedFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.UnnamedFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameTokenKind = TokenKind.FunctionKeyword;
}
