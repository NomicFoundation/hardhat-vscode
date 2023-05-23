import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class StateVariableDeclaration extends DefinitionVisitor {
  public ruleKind = RuleKind.StateVariableDeclaration;
  public symbolKind = SymbolKind.Property;
}
