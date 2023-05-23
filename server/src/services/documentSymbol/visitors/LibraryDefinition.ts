import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class LibraryDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.LibraryDefinition;
  public symbolKind = SymbolKind.Class;
}
