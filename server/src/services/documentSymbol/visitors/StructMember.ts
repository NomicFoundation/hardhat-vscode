import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class StructMember extends DefinitionVisitor {
  public ruleKind = RuleKind.StructMember;
  public symbolKind = SymbolKind.Property;
}
