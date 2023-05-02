/* eslint-disable @typescript-eslint/naming-convention */
import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getTokenTypeIndex } from "./tokenTypes";
import { OffsetTranslator } from "./OffsetTranslator";
import { SlangNode } from "./slangHelpers";

// Helps building a SemanticTokens response by providing slang nodes and supported token types
export class SemanticTokensBuilder {
  private tokenData: number[] = [];
  private lastTokenLine = 0;
  private lastTokenChar = 0;

  constructor(
    private document: TextDocument,
    private offsetTranslator: OffsetTranslator
  ) {}

  public addToken(node: SlangNode, type: SemanticTokenTypes, modifiers = 0) {
    // Convert byte offset to character offset
    const charOffset = this.offsetTranslator.translate(Number(node.range[0]));
    const charLength =
      this.offsetTranslator.translate(Number(node.range[1])) - charOffset;

    const position = this.document.positionAt(charOffset);

    // Calculate character and line difference to last token
    const lineDelta = position.line - this.lastTokenLine;
    const charDelta =
      lineDelta === 0
        ? position.character - this.lastTokenChar
        : position.character;

    this.lastTokenLine = position.line;
    this.lastTokenChar = position.character;

    this.tokenData.push(
      lineDelta,
      charDelta,
      charLength,
      getTokenTypeIndex(type),
      modifiers
    );
  }

  public getTokenData() {
    return this.tokenData;
  }
}
