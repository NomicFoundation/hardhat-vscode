import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Cursor } from "@nomicfoundation/slang/cursor";
import {
  SlangNodeWrapper,
  slangToVSCodeRange,
} from "../../../parser/slangHelpers";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ConstructorDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ConstructorDefinition;
  public symbolKind = SymbolKind.Constructor;

  protected getSymbolAttributes(nodeWrapper: SlangNodeWrapper) {
    return {
      name: "constructor",
      range: slangToVSCodeRange(this.document, nodeWrapper.textRange),
      selectionRange: slangToVSCodeRange(this.document, nodeWrapper.textRange),
      kind: this.symbolKind,
    };
  }
}
