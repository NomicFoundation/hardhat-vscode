import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class FallbackFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.FallbackFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [
    FieldName.FallbackKeyword,
    TokenKind.FallbackKeyword,
  ] as const;
}
