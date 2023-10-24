import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ContractDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ContractDefinition;
  public symbolKind = SymbolKind.Class;
}
