import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class EnumDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.EnumDefinition;
  public symbolKind = SymbolKind.Enum;
  public nameTokenKind = TokenKind.Identifier;
}
