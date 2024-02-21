import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class UserDefinedValueTypeDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.UserDefinedValueTypeDefinition;
  public symbolKind = SymbolKind.TypeParameter;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
