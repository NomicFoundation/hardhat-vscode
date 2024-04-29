import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class UnnamedFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.UnnamedFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [
    NodeLabel.FunctionKeyword,
    TokenKind.FunctionKeyword,
  ] as const;
}
