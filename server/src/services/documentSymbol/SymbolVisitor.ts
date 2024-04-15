/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SymbolKind } from "vscode-languageserver-types";
import _ from "lodash";
import { NodeLabel, RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { TokenNode } from "@nomicfoundation/slang/cst";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { slangToVSCodeRange } from "../../parser/slangHelpers";
import { SymbolTreeBuilder } from "./SymbolTreeBuilder";

export abstract class SymbolVisitor {
  public abstract ruleKind: RuleKind;
  public abstract symbolKind: SymbolKind;
  /** The token that contains the name of the symbol represented by the rule. */
  public abstract nameToken: readonly [NodeLabel, TokenKind];

  constructor(
    public document: TextDocument,
    public symbolBuilder: SymbolTreeBuilder
  ) {}

  public onRuleNode(cursor: Cursor): void {
    const range = slangToVSCodeRange(this.document, cursor.textRange);

    let symbolName = "-";
    let selectionRange = slangToVSCodeRange(this.document, cursor.textRange);

    // Find identifier
    const childCursor = cursor.spawn();

    while (childCursor.goToNextTokenWithKind(this.nameToken[1])) {
      if (childCursor.label !== this.nameToken[0]) {
        continue;
      }

      const nameToken = childCursor.node() as TokenNode;

      symbolName = nameToken.text;
      selectionRange = slangToVSCodeRange(this.document, childCursor.textRange);
      break;
    }

    let lastOpenSymbol;

    while ((lastOpenSymbol = this.symbolBuilder.lastOpenSymbol())) {
      const lastEndOffset = this.document.offsetAt(lastOpenSymbol.range!.end);
      const currentEndOffset = this.document.offsetAt(range.end);

      if (lastEndOffset < currentEndOffset) {
        this.symbolBuilder.closeSymbol();
      } else {
        break;
      }
    }

    this.symbolBuilder.openSymbol({
      kind: this.symbolKind,
      name: symbolName,
      range,
      selectionRange,
    });
  }
}
