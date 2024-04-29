import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class FallbackFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.FallbackFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [
    NodeLabel.FallbackKeyword,
    TokenKind.FallbackKeyword,
  ] as const;
}
