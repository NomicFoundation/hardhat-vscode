/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { TextDocument } from "vscode-languageserver-textdocument";
import { SlangNodeWrapper } from "../../parser/slangHelpers";
import { SymbolTreeBuilder } from "./SymbolTreeBuilder";

// Abstraction for a visitor that wants to build part of the document symbol tree
export abstract class SymbolVisitor {
  constructor(
    public document: TextDocument,
    public symbolBuilder: SymbolTreeBuilder
  ) {}

  public enter(nodeWrapper: SlangNodeWrapper): void {}
  public exit(nodeWrapper: SlangNodeWrapper): void {}
}
