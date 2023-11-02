import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class UserDefinedValueTypeDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.UserDefinedValueTypeDefinition;
  public symbolKind = SymbolKind.TypeParameter;
  public nameTokenKind = TokenKind.Identifier;
}
