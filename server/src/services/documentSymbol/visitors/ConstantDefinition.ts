import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ConstantDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ConstantDefinition;
  public symbolKind = SymbolKind.Constant;
}
