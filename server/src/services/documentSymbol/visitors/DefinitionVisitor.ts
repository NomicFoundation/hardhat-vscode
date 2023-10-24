/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DocumentSymbol, SymbolKind } from "vscode-languageserver-types";
import _ from "lodash";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { NodeType } from "@nomicfoundation/slang/cst";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { slangToVSCodeRange } from "../../../parser/slangHelpers";
import { SymbolVisitor } from "../SymbolVisitor";

export abstract class DefinitionVisitor extends SymbolVisitor {
  public abstract ruleKind: RuleKind;
  public abstract symbolKind: SymbolKind;

  public enter(cursor: Cursor): void {
    const node = cursor.node;
    const ancestors = cursor.pathRuleNodes;

    // Open a new symbol node on the DocumentSymbol tree on matching rules
    if (node.type === NodeType.Rule && node.kind === this.ruleKind) {
      this.symbolBuilder.openSymbol(this.getSymbolAttributes(cursor));
    }

    // Set the symbol node's range and name when finding the related identifier
    if (node.type === NodeType.Token && node.kind === TokenKind.Identifier) {
      const parent = _.last(ancestors)!;

      if (parent.type !== NodeType.Rule || parent.kind !== this.ruleKind) {
        return;
      }

      const lastSymbol = _.last(this.symbolBuilder.currentPath);

      if (lastSymbol === undefined) {
        return;
      }

      const identifierRange = slangToVSCodeRange(
        this.document,
        cursor.textRange
      );

      lastSymbol.name = this.document.getText(identifierRange);
      lastSymbol.selectionRange = identifierRange;
    }
  }

  protected getSymbolAttributes(cursor: Cursor): Partial<DocumentSymbol> {
    return {
      range: slangToVSCodeRange(this.document, cursor.textRange),
      selectionRange: slangToVSCodeRange(this.document, cursor.textRange),
      kind: this.symbolKind,
    };
  }

  public exit(cursor: Cursor): void {
    const node = cursor.node;
    if (node.type === NodeType.Rule && node.kind === this.ruleKind) {
      this.symbolBuilder.closeSymbol();
    }
  }
}
