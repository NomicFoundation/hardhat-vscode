import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ModifierDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ModifierDefinition;
  public symbolKind = SymbolKind.Function;
}
