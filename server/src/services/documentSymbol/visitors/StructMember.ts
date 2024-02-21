import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class StructMember extends SymbolVisitor {
  public ruleKind = RuleKind.StructMember;
  public symbolKind = SymbolKind.Property;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
