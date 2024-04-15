import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class FunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.FunctionDefinition;
  public symbolKind = SymbolKind.Function;
  // TODO: Support functions named "receive" and "fallback" post 0.6.0
  // (they use TokenKind.{ReceiveKeyword, FallbackKeyword} instead)
  public nameToken = [NodeLabel.Variant, TokenKind.Identifier] as const;
}
