import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang";
import { SlangNode, slangToVSCodeRange } from "../../../parser/slangHelpers";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ReceiveFunctionDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ReceiveFunctionDefinition;
  public symbolKind = SymbolKind.Function;

  protected getSymbolAttributes(node: SlangNode) {
    return {
      name: "receive",
      range: slangToVSCodeRange(this.document, node.charRange),
      selectionRange: slangToVSCodeRange(this.document, node.charRange),
      kind: this.symbolKind,
    };
  }
}
