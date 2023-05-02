import { NodeType, TokenNode } from "@nomicfoundation/slang";
import _ from "lodash";
import { TextDocument } from "vscode-languageserver-textdocument";
import { SlangNode, visit } from "./slangHelpers";

// Scans through a text document and its tokens to provide byte-to-character offset conversion
export class OffsetTranslator {
  private offsetMapping: Record<number, number> = {};
  private lastEndByte = 0;
  private lastEndChar = 0;

  constructor(document: TextDocument, parseTree: SlangNode) {
    const buffer = Buffer.from(document.getText());

    // Visit the tree and store all found token nodes
    const unsortedTokens: TokenNode[] = [];
    visit(parseTree, (node) => {
      if (node.type === NodeType.Token) {
        unsortedTokens.push(node);
      }
    });

    // Sort the nodes by their start offset
    const tokens = _.sortBy(unsortedTokens, (token) => token.range[0]);

    for (const token of tokens) {
      const startByte = Number(token.range[0]);
      const endByte = Number(token.range[1]);

      // `separation` is the space between the end of the last processed token and the
      // start of the current one. This might be always 0 on a CST but != 0 on an AST
      const separationStartByte = this.lastEndByte;
      const separationEndByte = startByte;
      const separationStartChar = this.lastEndChar;
      const separationCharLength = this._getCharLength(
        buffer,
        separationStartByte,
        separationEndByte
      );
      const separationEndChar = separationStartChar + separationCharLength;

      const startChar = separationEndChar;
      const charLength = this._getCharLength(buffer, startByte, endByte);
      const endChar = startChar + charLength;

      this.offsetMapping[startByte] = startChar;
      this.offsetMapping[endByte] = startChar + charLength;

      this.lastEndByte = endByte;
      this.lastEndChar = endChar;
    }
  }

  public translate(byteOffset: number) {
    const translated = this.offsetMapping[byteOffset];

    if (translated === undefined) {
      throw new Error(`Offset not indexed: ${byteOffset}`);
    }

    return translated;
  }

  private _getCharLength(buffer: Buffer, startByte: number, endByte: number) {
    return buffer.slice(startByte, endByte).toString().length;
  }
}
