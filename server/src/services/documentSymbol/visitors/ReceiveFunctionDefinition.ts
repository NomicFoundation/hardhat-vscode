import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Cursor } from "@nomicfoundation/slang/cursor";
import {
  SlangNodeWrapper,
  slangToVSCodeRange,
} from "../../../parser/slangHelpers";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ReceiveFunctionDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ReceiveFunctionDefinition;
  public symbolKind = SymbolKind.Function;

  protected getSymbolAttributes(nodeWrapper: SlangNodeWrapper) {
    return {
      name: "receive",
      range: slangToVSCodeRange(this.document, nodeWrapper.textRange),
      selectionRange: slangToVSCodeRange(this.document, nodeWrapper.textRange),
      kind: this.symbolKind,
    };
  }
}
