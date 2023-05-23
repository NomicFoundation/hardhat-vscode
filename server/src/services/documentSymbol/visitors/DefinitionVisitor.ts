/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DocumentSymbol, SymbolKind } from "vscode-languageserver-types";
import { NodeType, RuleKind, TokenKind } from "@nomicfoundation/slang";
import _ from "lodash";
import { SlangNode, slangToVSCodeRange } from "../../../parser/slangHelpers";
import { SymbolVisitor } from "../SymbolVisitor";

export abstract class DefinitionVisitor extends SymbolVisitor {
  public abstract ruleKind: RuleKind;
  public abstract symbolKind: SymbolKind;

  public enter(node: SlangNode, ancestors: SlangNode[]): void {
    // Open a new symbol node on the DocumentSymbol tree on matching rules
    if (node.type === NodeType.Rule && node.kind === this.ruleKind) {
      this.symbolBuilder.start(this.getSymbolAttributes(node));
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

      const identifierRange = slangToVSCodeRange(this.document, node.charRange);

      lastSymbol.name = this.document.getText(identifierRange);
      lastSymbol.selectionRange = identifierRange;
    }
  }

  protected getSymbolAttributes(node: SlangNode): Partial<DocumentSymbol> {
    return {
      range: slangToVSCodeRange(this.document, node.charRange),
      selectionRange: slangToVSCodeRange(this.document, node.charRange),
      kind: this.symbolKind,
    };
  }

  public exit(node: SlangNode): void {
    if (node.type === NodeType.Rule && node.kind === this.ruleKind) {
      this.symbolBuilder.end();
    }
  }
}
