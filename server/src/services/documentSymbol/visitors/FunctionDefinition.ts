import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class FunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.FunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameTokenKind = TokenKind.Identifier;
}
