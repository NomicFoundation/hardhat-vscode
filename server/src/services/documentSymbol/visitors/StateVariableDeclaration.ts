import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class StateVariableDeclaration extends DefinitionVisitor {
  public ruleKind = RuleKind.StateVariableDefinition;
  public symbolKind = SymbolKind.Property;
}
