import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ErrorDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ErrorDefinition;
  public symbolKind = SymbolKind.Event;
  public nameTokenKind = TokenKind.Identifier;
}
