/* eslint-disable @typescript-eslint/naming-convention */
import { SemanticTokenTypes } from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import { SlangNode } from "../../parser/slangHelpers";
import { getTokenTypeIndex } from "./tokenTypes";

// Helps building a SemanticTokens response by providing slang nodes and supported token types
export class SemanticTokensBuilder {
  private tokenData: number[] = [];
  private lastTokenLine = 0;
  private lastTokenChar = 0;

  constructor(private document: TextDocument) {}

  public addToken(node: SlangNode, type: SemanticTokenTypes, modifiers = 0) {
    const offset = node.charRange[0];
    const length = node.charRange[1] - node.charRange[0];

    const position = this.document.positionAt(offset);

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
      length,
      getTokenTypeIndex(type),
      modifiers
    );
  }

  public getTokenData() {
    return this.tokenData;
  }
}
