import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind, NodeLabel } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ErrorDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ErrorDefinition;
  public symbolKind = SymbolKind.Event;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
