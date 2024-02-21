import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class StateVariableDeclaration extends SymbolVisitor {
  public ruleKind = RuleKind.StateVariableDefinition;
  public symbolKind = SymbolKind.Property;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
