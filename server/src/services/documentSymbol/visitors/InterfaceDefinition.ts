import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class InterfaceDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.InterfaceDefinition;
  public symbolKind = SymbolKind.Interface;
}