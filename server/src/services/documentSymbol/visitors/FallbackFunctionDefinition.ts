import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { SlangNode, slangToVSCodeRange } from "../../../parser/slangHelpers";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class FallbackFunctionDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.FallbackFunctionDefinition;
  public symbolKind = SymbolKind.Function;

  protected getSymbolAttributes(node: SlangNode) {
    return {
      name: "fallback",
      range: slangToVSCodeRange(this.document, node.charRange),
      selectionRange: slangToVSCodeRange(this.document, node.charRange),
      kind: this.symbolKind,
    };
  }
}
