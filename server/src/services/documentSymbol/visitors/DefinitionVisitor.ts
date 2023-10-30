/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DocumentSymbol, SymbolKind } from "vscode-languageserver-types";
import _ from "lodash";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { NodeType } from "@nomicfoundation/slang/cst";
import {
  SlangNodeWrapper,
  slangToVSCodeRange,
} from "../../../parser/slangHelpers";
import { SymbolVisitor } from "../SymbolVisitor";

export abstract class DefinitionVisitor extends SymbolVisitor {
  public abstract ruleKind: RuleKind;
  public abstract symbolKind: SymbolKind;

  public enter(nodeWrapper: SlangNodeWrapper): void {
    // Open a new symbol node on the DocumentSymbol tree on matching rules
    if (
      nodeWrapper.type === NodeType.Rule &&
      nodeWrapper.kind === this.ruleKind
    ) {
      this.symbolBuilder.openSymbol(this.getSymbolAttributes(nodeWrapper));
    }

    // Set the symbol node's range and name when finding the related identifier
    if (
      nodeWrapper.type === NodeType.Token &&
      nodeWrapper.kind === TokenKind.Identifier
    ) {
      const parent = _.last(nodeWrapper.pathRuleNodes)!;

      if (parent.type !== NodeType.Rule || parent.kind !== this.ruleKind) {
        return;
      }

      const lastSymbol = _.last(this.symbolBuilder.currentPath);

      if (lastSymbol === undefined) {
        return;
      }

      const identifierRange = slangToVSCodeRange(
        this.document,
        nodeWrapper.textRange
      );

      lastSymbol.name = nodeWrapper.text;
      lastSymbol.selectionRange = identifierRange;
    }
  }

  protected getSymbolAttributes(
    nodeWrapper: SlangNodeWrapper
  ): Partial<DocumentSymbol> {
    return {
      range: slangToVSCodeRange(this.document, nodeWrapper.textRange),
      selectionRange: slangToVSCodeRange(this.document, nodeWrapper.textRange),
      kind: this.symbolKind,
    };
  }

  public exit(nodeWrapper: SlangNodeWrapper): void {
    if (
      nodeWrapper.type === NodeType.Rule &&
      nodeWrapper.kind === this.ruleKind
    ) {
      this.symbolBuilder.closeSymbol();
    }
  }
}
