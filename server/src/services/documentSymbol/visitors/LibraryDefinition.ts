import { SymbolKind } from "vscode-languageserver-types";
import { FieldName, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class LibraryDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.LibraryDefinition;
  public symbolKind = SymbolKind.Class;
  public nameToken = [FieldName.Name, TokenKind.Identifier] as const;
}
