/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { TextDocument } from "vscode-languageserver-textdocument";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";

// Abstraction for a visitor that wants to highlight tokens
export abstract class HighlightVisitor {
  constructor(
    public document: TextDocument,
    public tokenBuilder: SemanticTokensBuilder
  ) {}

  public enter(cursor: Cursor): void {}
  public exit(cursor: Cursor): void {}
}
