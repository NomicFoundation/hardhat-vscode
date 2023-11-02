import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class StructMember extends SymbolVisitor {
  public ruleKind = RuleKind.StructMember;
  public symbolKind = SymbolKind.Property;
  public nameTokenKind = TokenKind.Identifier;
}
