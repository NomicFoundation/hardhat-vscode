/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SymbolKind } from "vscode-languageserver-types";
import _ from "lodash";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { TokenNode } from "@nomicfoundation/slang/cst";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { slangToVSCodeRange } from "../../parser/slangHelpers";
import { SymbolTreeBuilder } from "./SymbolTreeBuilder";

export abstract class SymbolVisitor {
  public abstract ruleKind: RuleKind;
  public abstract symbolKind: SymbolKind;
  public abstract nameTokenKind: TokenKind;

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

    do {
      const nameToken: TokenNode | null = childCursor.findTokenWithKind([
        this.nameTokenKind,
      ]);

      const depth = childCursor.pathRuleNodes().length;
      if (nameToken && depth === 1) {
        symbolName = nameToken.text;
        selectionRange = slangToVSCodeRange(
          this.document,
          childCursor.textRange
        );
        break;
      }
    } while (childCursor.goToNext());

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
