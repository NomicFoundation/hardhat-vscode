import { SymbolKind } from "vscode-languageserver-types";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { slangToVSCodeRange } from "../../../parser/slangHelpers";
import { DefinitionVisitor } from "./DefinitionVisitor";

export class ConstructorDefinition extends DefinitionVisitor {
  public ruleKind = RuleKind.ConstructorDefinition;
  public symbolKind = SymbolKind.Constructor;

  protected getSymbolAttributes(cursor: Cursor) {
    return {
      name: "constructor",
      range: slangToVSCodeRange(this.document, cursor.textRange),
      selectionRange: slangToVSCodeRange(this.document, cursor.textRange),
      kind: this.symbolKind,
    };
  }
}
