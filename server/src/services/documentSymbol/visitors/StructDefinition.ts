import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class StructDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.StructDefinition;
  public symbolKind = SymbolKind.Struct;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
