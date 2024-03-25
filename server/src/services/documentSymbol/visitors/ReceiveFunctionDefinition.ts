import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class ReceiveFunctionDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.ReceiveFunctionDefinition;
  public symbolKind = SymbolKind.Function;
  public nameToken = [
    FieldName.ReceiveKeyword,
    TokenKind.ReceiveKeyword,
  ] as const;
}
