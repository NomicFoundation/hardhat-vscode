import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class UserDefinedValueTypeDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.UserDefinedValueTypeDefinition;
  public symbolKind = SymbolKind.TypeParameter;
}
