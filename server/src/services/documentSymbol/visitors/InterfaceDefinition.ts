import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class InterfaceDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.InterfaceDefinition;
  public symbolKind = SymbolKind.Interface;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
