import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind, FieldName } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ConstructorDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ConstructorDefinition;
  public symbolKind = SymbolKind.Constructor;
  public nameToken = [
    FieldName.ConstructorKeyword,
    TokenKind.ConstructorKeyword,
  ] as const;
}
