import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { SymbolVisitor } from "../SymbolVisitor";

export class LibraryDefinition extends SymbolVisitor {
  public ruleKind = RuleKind.LibraryDefinition;
  public symbolKind = SymbolKind.Class;
  public nameTokenKind = TokenKind.Identifier;
}
