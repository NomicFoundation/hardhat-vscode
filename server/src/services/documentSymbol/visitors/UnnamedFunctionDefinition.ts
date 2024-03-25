import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class UnnamedFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.UnnamedFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [
    FieldName.FunctionKeyword,
    TokenKind.FunctionKeyword,
  ] as const;
}
