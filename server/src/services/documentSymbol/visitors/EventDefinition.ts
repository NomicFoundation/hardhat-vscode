import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class EventDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.EventDefinition;
  public symbolKind = SymbolKind.Event;
}
