import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ConstantDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ConstantDefinition;
  public symbolKind = SymbolKind.Constant;
}
