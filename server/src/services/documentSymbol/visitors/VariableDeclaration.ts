import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class VariableDeclaration extends DefinitionVisitor {
  public ruleKind = RuleKind.VariableDeclaration;
  public symbolKind = SymbolKind.Variable;
}
