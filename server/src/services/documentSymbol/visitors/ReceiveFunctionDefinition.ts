import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ReceiveFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ReceiveFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameTokenKind = TokenKind.ReceiveKeyword;
}
