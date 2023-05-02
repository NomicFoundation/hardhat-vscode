import { TextDocument } from "vscode-languageserver-textdocument";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";
import { SlangNode } from "./slangHelpers";

// Abstraction for a visitor that wants to highlight tokens
export abstract class HighlightVisitor {
  constructor(
    public document: TextDocument,
    public tokenBuilder: SemanticTokensBuilder
  ) {}

  public abstract visit(node: SlangNode, ancestors: SlangNode[]): void;
}
