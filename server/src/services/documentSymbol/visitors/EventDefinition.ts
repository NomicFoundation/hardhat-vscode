import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind, FieldName } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class EventDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.EventDefinition;
  public symbolKind = SymbolKind.Event;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
