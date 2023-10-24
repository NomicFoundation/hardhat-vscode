import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class FunctionDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.FunctionDefinition;
  public symbolKind = SymbolKind.Function;
}
