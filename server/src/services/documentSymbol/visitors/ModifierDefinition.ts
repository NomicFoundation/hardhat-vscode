import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ModifierDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ModifierDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
