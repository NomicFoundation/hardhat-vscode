import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind, NodeLabel } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ConstantDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ConstantDefinition;
  public symbolKind = SymbolKind.Constant;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
