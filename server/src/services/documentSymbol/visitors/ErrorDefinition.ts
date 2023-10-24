import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ErrorDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ErrorDefinition;
  public symbolKind = SymbolKind.Event;
}
