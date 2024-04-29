import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ModifierDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ModifierDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
