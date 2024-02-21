import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class EnumDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.EnumDefinition;
  public symbolKind = SymbolKind.Enum;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
