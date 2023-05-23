import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class VariableDeclarationStatement extends DefinitionVisitor {
  public ruleKind = RuleKind.VariableDeclarationStatement;
  public symbolKind = SymbolKind.Variable;
}
