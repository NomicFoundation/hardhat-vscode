import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind, FieldName } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ConstantDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ConstantDefinition;
  public symbolKind = SymbolKind.Constant;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
