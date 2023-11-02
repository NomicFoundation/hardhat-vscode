import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class EventDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.EventDefinition;
  public symbolKind = SymbolKind.Event;
  public nameTokenKind = TokenKind.Identifier;
}
