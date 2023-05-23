import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { SlangNode, slangToVSCodeRange } from "../../../parser/slangHelpers";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ConstructorDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ConstructorDefinition;
  public symbolKind = SymbolKind.Constructor;

  protected getSymbolAttributes(node: SlangNode) {
    return {
      name: "constructor",
      range: slangToVSCodeRange(this.document, node.charRange),
      selectionRange: slangToVSCodeRange(this.document, node.charRange),
      kind: this.symbolKind,
    };
  }
}
