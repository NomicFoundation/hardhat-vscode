import { SymbolKind } from "vscode-languageserver-types";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class UserDefinedValueTypeDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.UserDefinedValueTypeDefinition;
  public symbolKind = SymbolKind.TypeParameter;
  public nameToken = [NodeLabel.Name, TokenKind.Identifier] as const;
}
