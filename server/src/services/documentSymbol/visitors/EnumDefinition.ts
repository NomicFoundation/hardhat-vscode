import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class EnumDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.EnumDefinition;
  public symbolKind = SymbolKind.Enum;
}
