import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class StructDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.StructDefinition;
  public symbolKind = SymbolKind.Struct;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
