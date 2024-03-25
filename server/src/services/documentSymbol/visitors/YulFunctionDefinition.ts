import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class YulFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.YulFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [FieldName.Name, TokenKind.YulIdentifier] as const;
}
